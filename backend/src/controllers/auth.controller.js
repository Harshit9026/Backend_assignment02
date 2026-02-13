const User = require('../models/User.model');
const { AppError, sendSuccess } = require('../utils/apiHelpers');
const logger = require('../utils/logger');

/**
 * Helper to send auth tokens in response
 */
const sendAuthResponse = async (user, statusCode, message, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to DB
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    message,
    token: accessToken,
    refreshToken,
    user: user.toSafeObject(),
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    // Create user
    const user = await User.create({ name, email, password });

    logger.info(`New user registered: ${email}`);
    await sendAuthResponse(user, 201, 'Account created successfully!', res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field (excluded by default)
    const user = await User.findOne({ email }).select('+password +refreshToken +refreshTokenExpiry');

    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 401));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Update last login
    user.lastLogin = new Date();

    logger.info(`User logged in: ${email}`);
    await sendAuthResponse(user, 200, 'Login successful!', res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (with refresh token)
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(new AppError('Refresh token is required.', 400));
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken: token }).select('+refreshToken +refreshTokenExpiry');

    if (!user) {
      return next(new AppError('Invalid refresh token.', 401));
    }

    // Check if refresh token is expired
    if (user.refreshTokenExpiry < new Date()) {
      user.refreshToken = undefined;
      user.refreshTokenExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Refresh token expired. Please log in again.', 401));
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // Clear refresh token
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: '', refreshTokenExpiry: '' },
    });

    sendSuccess(res, 200, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    sendSuccess(res, 200, 'User retrieved successfully', { user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    if (currentPassword === newPassword) {
      return next(new AppError('New password must be different from current password.', 400));
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password updated for user: ${user.email}`);
    await sendAuthResponse(user, 200, 'Password updated successfully!', res);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, updatePassword };
