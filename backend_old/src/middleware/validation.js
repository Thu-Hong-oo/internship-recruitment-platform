const { validationResult } = require('express-validator');

/**
 * Middleware to validate request and format errors
 * @param {Array} validations - Array of express-validator validation rules
 * @returns {Function} Express middleware function
 */
const validateRequest = validations => {
  return async (req, res, next) => {
    // Run all validations
    if (Array.isArray(validations)) {
      await Promise.all(validations.map(validation => validation.run(req)));
    }

    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: formattedErrors,
      });
    }

    next();
  };
};

/**
 * Format validation errors for consistent response
 * @param {Object} errors - Express-validator errors object
 * @returns {Array} Formatted errors array
 */
const formatValidationErrors = errors => {
  return errors.array().map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value,
    location: error.location,
  }));
};

/**
 * Custom validation middleware for complex validation logic
 * @param {Function} validationFn - Custom validation function
 * @returns {Function} Express middleware function
 */
const customValidate = validationFn => {
  return async (req, res, next) => {
    try {
      const result = await validationFn(
        req.body,
        req.params,
        req.query,
        req.user
      );

      if (result.isValid === false) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Dữ liệu không hợp lệ',
          errors: result.errors || [],
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateRequest,
  formatValidationErrors,
  customValidate,
};
