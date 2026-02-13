const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../utils/apiHelpers');

/**
 * Middleware to handle validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    return next(new AppError('Validation failed', 400, formattedErrors));
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email cannot exceed 100 characters'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
];

const updatePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),

  validate,
];

// ─── Task Validators ──────────────────────────────────────────────────────────
const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('status')
    .optional({ checkFalsy: true })
    .isIn(['todo', 'in-progress', 'completed']).withMessage('Status must be todo, in-progress, or completed'),

  body('priority')
    .optional({ checkFalsy: true })
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),

  // Fix: optional({ checkFalsy: true }) skips empty strings ""
  body('dueDate')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true; // skip if empty
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Due date must be a valid date');
      }
      // Allow dates within the last minute (timezone tolerance)
      const oneMinuteAgo = new Date(Date.now() - 60000);
      if (date < oneMinuteAgo) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),

  body('tags')
    .optional({ checkFalsy: true })
    .custom((tags) => {
      if (!tags) return true;
      if (!Array.isArray(tags)) throw new Error('Tags must be an array');
      if (tags.length > 10) throw new Error('Cannot have more than 10 tags');
      if (tags.some((tag) => typeof tag !== 'string' || tag.length > 30)) {
        throw new Error('Each tag must be a string under 30 characters');
      }
      return true;
    }),

  validate,
];

const updateTaskValidator = [
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('status')
    .optional({ checkFalsy: true })
    .isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),

  body('priority')
    .optional({ checkFalsy: true })
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),

  body('dueDate')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new Error('Due date must be a valid date');
      return true;
    }),

  body('tags')
    .optional({ checkFalsy: true })
    .custom((tags) => {
      if (!tags) return true;
      if (!Array.isArray(tags)) throw new Error('Tags must be an array');
      if (tags.length > 10) throw new Error('Max 10 tags allowed');
      return true;
    }),

  validate,
];

// ─── Param Validators ─────────────────────────────────────────────────────────
const mongoIdValidator = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName} format`),
  validate,
];

// ─── Query Validators ─────────────────────────────────────────────────────────
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  createTaskValidator,
  updateTaskValidator,
  mongoIdValidator,
  paginationValidator,
};
