const { AppError } = require('../../utils/errors');

class ValidationHelpers {
  /**
   * Validate section parameter
   */
  static validateSection(section) {
    const validSections = [
      'education',
      'experience',
      'skills',
      'projects',
      'certifications',
    ];
    if (!validSections.includes(section)) {
      throw new AppError(
        `Invalid section. Must be one of: ${validSections.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate profile update section
   */
  static validateProfileSection(section) {
    const validSections = ['profile', 'visibility', 'preferences'];
    if (!validSections.includes(section)) {
      throw new AppError(
        `Invalid section. Must be one of: ${validSections.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate job action
   */
  static validateJobAction(action) {
    const validActions = ['save', 'unsave', 'apply'];
    if (!validActions.includes(action)) {
      throw new AppError(
        `Invalid action. Must be one of: ${validActions.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate company action
   */
  static validateCompanyAction(action) {
    const validActions = ['follow', 'unfollow'];
    if (!validActions.includes(action)) {
      throw new AppError(
        `Invalid action. Must be one of: ${validActions.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate application action
   */
  static validateApplicationAction(action) {
    const validActions = ['withdraw'];
    if (!validActions.includes(action)) {
      throw new AppError(
        `Invalid action. Must be one of: ${validActions.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate resume action
   */
  static validateResumeAction(action) {
    const validActions = ['upload', 'parse', 'generate'];
    if (!validActions.includes(action)) {
      throw new AppError(
        `Invalid action. Must be one of: ${validActions.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (pageNum < 1) {
      throw new AppError('Page must be greater than 0', 400);
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new AppError('Limit must be between 1 and 100', 400);
    }

    return { page: pageNum, limit: limitNum };
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (Vietnamese)
   */
  static validatePhone(phone) {
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate required fields
   */
  static validateRequired(fields, data) {
    const missing = [];

    for (const field of fields) {
      if (
        !data[field] ||
        (typeof data[field] === 'string' && data[field].trim() === '')
      ) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
    }
  }

  /**
   * Validate skill level
   */
  static validateSkillLevel(level) {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (!validLevels.includes(level)) {
      throw new AppError(
        `Invalid skill level. Must be one of: ${validLevels.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate date format and range
   */
  static validateDate(dateString, fieldName = 'date') {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      throw new AppError(`Invalid ${fieldName} format`, 400);
    }

    // Check if date is not in the future (for things like graduation dates)
    const now = new Date();
    if (date > now) {
      throw new AppError(`${fieldName} cannot be in the future`, 400);
    }

    return date;
  }

  /**
   * Validate file type for uploads
   */
  static validateFileType(file, allowedTypes) {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        400
      );
    }
  }

  /**
   * Validate file size
   */
  static validateFileSize(file, maxSizeInMB) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new AppError(`File size exceeds ${maxSizeInMB}MB limit`, 400);
    }
  }
}

module.exports = ValidationHelpers;
