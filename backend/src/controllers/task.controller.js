const Task = require('../models/Task.model');
const { AppError, sendSuccess } = require('../utils/apiHelpers');
const logger = require('../utils/logger');

/**
 * Build query filters from request query params
 */
const buildTaskFilters = (query, userId, isAdmin) => {
  const filters = {};

  // Non-admins can only see their own tasks
  if (!isAdmin) {
    filters.owner = userId;
  } else if (query.owner) {
    filters.owner = query.owner;
  }

  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.tag) filters.tags = { $in: [query.tag] };
  if (query.archived !== undefined) filters.isArchived = query.archived === 'true';
  else filters.isArchived = false;

  // Full-text search
  if (query.search) {
    filters.$text = { $search: query.search };
  }

  // Date range filter
  if (query.dueBefore) filters.dueDate = { ...filters.dueDate, $lte: new Date(query.dueBefore) };
  if (query.dueAfter) filters.dueDate = { ...filters.dueDate, $gte: new Date(query.dueAfter) };

  return filters;
};

/**
 * @desc    Get all tasks (with filtering, pagination, sorting)
 * @route   GET /api/v1/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const isAdmin = req.user.role === 'admin';
    const filters = buildTaskFilters(req.query, req.user._id, isAdmin);

    // Execute queries in parallel
    const [tasks, total] = await Promise.all([
      Task.find(filters)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name email avatarInitials'),
      Task.countDocuments(filters),
    ]);

    sendSuccess(
      res,
      200,
      'Tasks retrieved successfully',
      { tasks },
      {
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/v1/tasks/:id
 * @access  Private (owner or admin)
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('owner', 'name email avatarInitials');

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && task.owner._id.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to view this task.', 403));
    }

    sendSuccess(res, 200, 'Task retrieved successfully', { task });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags: tags || [],
      owner: req.user._id,
    });

    const populatedTask = await task.populate('owner', 'name email avatarInitials');

    logger.info(`Task created: "${title}" by user ${req.user.email}`);
    sendSuccess(res, 201, 'Task created successfully!', { task: populatedTask });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/v1/tasks/:id
 * @access  Private (owner or admin)
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to update this task.', 403));
    }

    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatarInitials');

    sendSuccess(res, 200, 'Task updated successfully!', { task: updatedTask });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private (owner or admin)
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to delete this task.', 403));
    }

    await task.deleteOne();

    logger.info(`Task deleted: "${task.title}" by user ${req.user.email}`);
    sendSuccess(res, 200, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task statistics for current user
 * @route   GET /api/v1/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const ownerId = req.user.role === 'admin' ? {} : { owner: req.user._id };

    const stats = await Task.aggregate([
      { $match: { ...ownerId, isArchived: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] },
                    { $ne: ['$dueDate', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0, todo: 0, inProgress: 0, completed: 0, highPriority: 0, overdue: 0,
    };

    sendSuccess(res, 200, 'Stats retrieved successfully', { stats: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Archive a task
 * @route   PATCH /api/v1/tasks/:id/archive
 * @access  Private (owner or admin)
 */
const archiveTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to archive this task.', 403));
    }

    task.isArchived = !task.isArchived;
    await task.save();

    sendSuccess(res, 200, `Task ${task.isArchived ? 'archived' : 'unarchived'} successfully.`, { task });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats, archiveTask };
