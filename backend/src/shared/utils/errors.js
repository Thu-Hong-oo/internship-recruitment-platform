/**
 * Custom Application Error Class
 * Extends native Error to provide status codes and better error handling
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - for input validation failures
 */
class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Authentication Error - for auth failures
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error - for permission failures
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error - for resource not found
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error - for resource conflicts
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Internal Server Error - for unexpected errors
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

/**
 * Service Unavailable Error - for service outages
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Rate Limit Error - for rate limiting
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Bad Request Error - for malformed requests
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * Create error from Express validator errors
 */
const createValidationError = errors => {
  const messages = errors.map(error => `${error.param}: ${error.msg}`);
  return new ValidationError(messages.join(', '));
};

/**
 * Async error handler wrapper
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create error response
 */
const createErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    error: {
      message: error.message,
      status: error.status || 'error',
      statusCode: error.statusCode || 500,
    },
  };

  // Add additional info in development
  if (isDevelopment) {
    response.error.stack = error.stack;
    response.error.name = error.name;

    if (error.field) {
      response.error.field = error.field;
    }
  }

  // Add request info for logging
  if (req) {
    response.error.path = req.path;
    response.error.method = req.method;
    response.error.timestamp = new Date().toISOString();
  }

  return response;
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError,
  RateLimitError,
  BadRequestError,
  createValidationError,
  asyncHandler,
  createErrorResponse,
};
