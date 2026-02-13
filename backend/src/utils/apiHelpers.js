/**
 * Custom Application Error class
 * Extends native Error to carry HTTP status codes and operational flags
 */
class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Distinguishes operational vs programming errors
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Send a consistent success response
 */
const sendSuccess = (res, statusCode, message, data = {}, meta = {}) => {
  const response = {
    success: true,
    message,
    ...data,
  };

  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a consistent error response
 */
const sendError = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = { AppError, sendSuccess, sendError };
