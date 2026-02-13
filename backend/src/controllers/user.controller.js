const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { AppError, sendSuccess } = require('../utils/apiHelpers');
const logger = require('../utils/logger');

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const taskCount = await Task.countDocuments({ owner: req.user._id, isArchived: false });

    sendSuccess(res, 200, 'Profile retrieved successfully', {
      user: { ...user.toSafeObject(), taskCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    // Only allow safe fields to be updated
    const allowedFields = ['name'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields to update.', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    sendSuccess(res, 200, 'Profile updated successfully!', { user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate own account
 * @route   DELETE /api/v1/users/profile
 * @access  Private
 */
const deactivateAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    logger.info(`Account deactivated: ${req.user.email}`);
    sendSuccess(res, 200, 'Account deactivated successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, deactivateAccount };
