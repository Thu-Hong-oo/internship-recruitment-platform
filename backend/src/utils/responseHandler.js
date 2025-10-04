class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || null,
    });
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code (default: 500)
   * @param {Array} errors - Detailed error information
   */
  static error(
    res,
    message = 'Internal Server Error',
    statusCode = 500,
    errors = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || null,
    });
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {Object} pagination - Pagination info
   * @param {String} message - Success message
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.currentPage || 1,
        totalPages: pagination.totalPages || 1,
        total: pagination.total || 0,
        hasMore: pagination.hasMore || false,
        limit: pagination.limit || 10,
      },
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || null,
    });
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {String} message - Success message
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * Send updated response
   * @param {Object} res - Express response object
   * @param {*} data - Updated resource data
   * @param {String} message - Success message
   */
  static updated(res, data, message = 'Resource updated successfully') {
    return this.success(res, data, message, 200);
  }

  /**
   * Send deleted response
   * @param {Object} res - Express response object
   * @param {String} message - Success message
   */
  static deleted(res, message = 'Resource deleted successfully') {
    return this.success(res, null, message, 200);
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   * @param {String} message - Error message
   */
  static validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, 400, errors);
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static forbidden(res, message = 'Forbidden access') {
    return this.error(res, message, 403);
  }
}

module.exports = { ApiResponse };
