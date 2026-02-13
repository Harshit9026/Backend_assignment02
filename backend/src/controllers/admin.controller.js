const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { AppError, sendSuccess } = require('../utils/apiHelpers');
const logger = require('../utils/logger');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filters),
    ]);

    sendSuccess(
      res,
      200,
      'Users retrieved successfully',
      { users: users.map((u) => u.toSafeObject()) },
      {
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID (admin only)
 * @route   GET /api/v1/admin/users/:id
 * @access  Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    const taskStats = await Task.aggregate([
      { $match: { owner: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    sendSuccess(res, 200, 'User retrieved successfully', {
      user: user.toSafeObject(),
      taskStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role or status (admin only)
 * @route   PATCH /api/v1/admin/users/:id
 * @access  Admin
 */
const updateUser = async (req, res, next) => {
  try {
    // Prevent admin from modifying themselves
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError('Admins cannot modify their own admin status.', 400));
    }

    const allowedUpdates = ['role', 'isActive'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields to update.', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    logger.info(`Admin ${req.user.email} updated user ${user.email}: ${JSON.stringify(updates)}`);
    sendSuccess(res, 200, 'User updated successfully!', { user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user and their tasks (admin only)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError('Admins cannot delete themselves.', 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    // Delete all user's tasks
    const deletedTasks = await Task.deleteMany({ owner: req.params.id });

    await user.deleteOne();

    logger.info(`Admin ${req.user.email} deleted user ${user.email} and ${deletedTasks.deletedCount} tasks`);
    sendSuccess(res, 200, `User deleted successfully along with ${deletedTasks.deletedCount} tasks.`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform-wide statistics (admin only)
 * @route   GET /api/v1/admin/stats
 * @access  Admin
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [userStats, taskStats, recentUsers, recentTasks] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            users: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } },
          },
        },
      ]),
      Task.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt isActive'),
      Task.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'name email'),
    ]);

    sendSuccess(res, 200, 'Platform stats retrieved successfully', {
      users: userStats[0] || { total: 0, active: 0, admins: 0, users: 0 },
      tasks: taskStats[0] || { total: 0, todo: 0, inProgress: 0, completed: 0 },
      recentUsers,
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getPlatformStats };
