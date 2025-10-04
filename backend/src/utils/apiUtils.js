/**
 * Utility functions for API V2 optimization patterns
 * Provides section validation, include parsing, response formatting, and other common operations
 */

const mongoose = require('mongoose');

class APIUtils {
  // ============================================
  // SECTION VALIDATION UTILITIES
  // ============================================

  /**
   * Validate if a section name is allowed for candidate profiles
   * @param {string} section - Section name to validate
   * @returns {boolean} - True if section is valid
   */
  static isValidSection(section) {
    const validSections = [
      'basic',
      'contact',
      'education',
      'experience',
      'skills',
      'projects',
      'certifications',
      'languages',
      'preferences',
      'resume',
      'progress',
      'settings',
    ];
    return validSections.includes(section);
  }

  /**
   * Get all valid section names
   * @returns {string[]} - Array of valid section names
   */
  static getValidSections() {
    return [
      'basic',
      'contact',
      'education',
      'experience',
      'skills',
      'projects',
      'certifications',
      'languages',
      'preferences',
      'resume',
      'progress',
      'settings',
    ];
  }

  /**
   * Validate section for specific operations
   * @param {string} section - Section name
   * @param {string} operation - Operation type (create, update, delete)
   * @returns {Object} - Validation result with success and error message
   */
  static validateSectionOperation(section, operation) {
    // Sections that don't support certain operations
    const readOnlySections = ['basic', 'progress'];
    const noDeleteSections = ['basic', 'contact', 'preferences', 'settings'];

    if (!this.isValidSection(section)) {
      return {
        success: false,
        error: `Invalid section '${section}'. Valid sections: ${this.getValidSections().join(
          ', '
        )}`,
      };
    }

    if (operation === 'update' && readOnlySections.includes(section)) {
      return {
        success: false,
        error: `Section '${section}' cannot be directly updated. Use specific endpoints instead.`,
      };
    }

    if (operation === 'delete' && noDeleteSections.includes(section)) {
      return {
        success: false,
        error: `Section '${section}' cannot be deleted. Items can only be updated or cleared.`,
      };
    }

    return { success: true };
  }

  // ============================================
  // INCLUDE PARSING UTILITIES
  // ============================================

  /**
   * Parse include query parameter into array of sections
   * @param {string} includeQuery - Comma-separated include sections
   * @returns {string[]} - Array of valid include sections
   */
  static parseIncludes(includeQuery) {
    if (!includeQuery) {
      return [];
    }

    const includes = includeQuery.split(',').map(section => section.trim());
    const validIncludes = [];

    for (const include of includes) {
      if (this.isValidSection(include)) {
        validIncludes.push(include);
      }
    }

    return validIncludes;
  }

  /**
   * Build MongoDB projection object from includes array
   * @param {string[]} includes - Array of sections to include
   * @returns {Object} - MongoDB projection object
   */
  static buildProjection(includes) {
    if (!includes || includes.length === 0) {
      return {}; // Return all fields
    }

    const projection = {
      _id: 1,
      userId: 1,
      profileCompletion: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    // Always include basic fields for core functionality
    const basicFields = ['basic', 'contact'];
    const allIncludes = [...new Set([...basicFields, ...includes])];

    // Map sections to actual field paths
    const sectionFieldMap = {
      basic: ['basic'],
      contact: ['contact'],
      education: ['education'],
      experience: ['experience'],
      skills: ['skills'],
      projects: ['projects'],
      certifications: ['certifications'],
      languages: ['languages'],
      preferences: ['preferences'],
      resume: ['resume'],
      progress: ['progress'],
      settings: ['settings'],
    };

    for (const section of allIncludes) {
      const fields = sectionFieldMap[section] || [section];
      fields.forEach(field => {
        projection[field] = 1;
      });
    }

    return projection;
  }

  // ============================================
  // DATA FILTERING UTILITIES
  // ============================================

  /**
   * Filter profile data based on includes array
   * @param {Object} profileData - Complete profile data
   * @param {string[]} includes - Sections to include in response
   * @returns {Object} - Filtered profile data
   */
  static filterProfileData(profileData, includes) {
    if (!includes || includes.length === 0) {
      // If no specific includes, return basic structure with core info
      return {
        _id: profileData._id,
        userId: profileData.userId,
        personalInfo: profileData.personalInfo,
        progress: profileData.progress,
        analytics: profileData.analytics,
        settings: profileData.settings,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt,
      };
    }

    const filtered = {
      _id: profileData._id,
      userId: profileData.userId,
      createdAt: profileData.createdAt,
      updatedAt: profileData.updatedAt,
    };

    // Always include basic info and progress
    filtered.personalInfo = profileData.personalInfo;
    filtered.progress = profileData.progress;
    filtered.analytics = profileData.analytics;

    // Include requested sections
    for (const section of includes) {
      if (profileData[section] !== undefined) {
        filtered[section] = profileData[section];
      }
    }

    return filtered;
  }

  /**
   * Filter sensitive information from profile data
   * @param {Object} profileData - Profile data to filter
   * @param {Object} options - Filtering options
   * @returns {Object} - Filtered data with sensitive info removed
   */
  static filterSensitiveData(profileData, options = {}) {
    const { includePrivate = false, includeInternal = false } = options;

    const filtered = { ...profileData };

    // Remove sensitive fields
    if (!includePrivate) {
      if (filtered.contact) {
        delete filtered.contact.personalEmail;
        delete filtered.contact.emergencyContact;
      }
      if (filtered.settings) {
        delete filtered.settings.privacy;
        delete filtered.settings.notifications?.email;
      }
    }

    // Remove internal fields
    if (!includeInternal) {
      delete filtered.__v;
      delete filtered.progress?.internalNotes;
      delete filtered.settings?.systemFlags;
    }

    return filtered;
  }

  // ============================================
  // RESPONSE FORMATTING UTILITIES
  // ============================================

  /**
   * Format success response with metadata
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - Formatted response object
   */
  static formatSuccessResponse(data, message, metadata = {}) {
    return {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date(),
        ...metadata,
      },
    };
  }

  /**
   * Format error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} details - Additional error details
   * @returns {Object} - Formatted error response
   */
  static formatErrorResponse(message, statusCode = 500, details = {}) {
    return {
      success: false,
      message,
      error: {
        code: statusCode,
        details,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Format paginated response
   * @param {Array} items - Array of items
   * @param {Object} pagination - Pagination info
   * @param {string} message - Response message
   * @returns {Object} - Formatted paginated response
   */
  static formatPaginatedResponse(items, pagination, message) {
    return {
      success: true,
      message,
      data: {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          pages: Math.ceil(pagination.total / pagination.limit),
          hasNext:
            pagination.page < Math.ceil(pagination.total / pagination.limit),
          hasPrev: pagination.page > 1,
        },
      },
      metadata: {
        timestamp: new Date(),
        count: items.length,
      },
    };
  }

  // ============================================
  // VALIDATION UTILITIES
  // ============================================

  /**
   * Validate MongoDB ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean} - True if valid ObjectId
   */
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid phone number
   */
  static isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // DATA TRANSFORMATION UTILITIES
  // ============================================

  /**
   * Clean and normalize string data
   * @param {string} str - String to clean
   * @returns {string} - Cleaned string
   */
  static cleanString(str) {
    if (typeof str !== 'string') return str;

    return str
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-\.@]/g, ''); // Remove special characters except common ones
  }

  /**
   * Normalize array data by removing duplicates and empty values
   * @param {Array} arr - Array to normalize
   * @returns {Array} - Normalized array
   */
  static normalizeArray(arr) {
    if (!Array.isArray(arr)) return [];

    return [
      ...new Set(
        arr.filter(item => item !== null && item !== undefined && item !== '')
      ),
    ];
  }

  /**
   * Convert string to slug format
   * @param {string} str - String to slugify
   * @returns {string} - Slug format string
   */
  static slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ============================================
  // QUERY UTILITIES
  // ============================================

  /**
   * Parse and validate pagination parameters
   * @param {Object} query - Request query parameters
   * @returns {Object} - Parsed pagination object
   */
  static parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Parse sorting parameters
   * @param {string} sortQuery - Sort query string (e.g., "-createdAt,name")
   * @returns {Object} - MongoDB sort object
   */
  static parseSort(sortQuery) {
    if (!sortQuery) return { createdAt: -1 }; // Default sort

    const sortObj = {};
    const sortFields = sortQuery.split(',');

    for (const field of sortFields) {
      const trimmed = field.trim();
      if (trimmed.startsWith('-')) {
        sortObj[trimmed.substring(1)] = -1;
      } else {
        sortObj[trimmed] = 1;
      }
    }

    return sortObj;
  }

  /**
   * Build search filter from query parameters
   * @param {Object} query - Request query parameters
   * @param {string[]} searchFields - Fields to search in
   * @returns {Object} - MongoDB filter object
   */
  static buildSearchFilter(query, searchFields = []) {
    const filter = {};

    // Text search
    if (query.search && searchFields.length > 0) {
      filter.$or = searchFields.map(field => ({
        [field]: { $regex: query.search, $options: 'i' },
      }));
    }

    // Date range filters
    if (query.createdAfter) {
      filter.createdAt = {
        ...filter.createdAt,
        $gte: new Date(query.createdAfter),
      };
    }
    if (query.createdBefore) {
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(query.createdBefore),
      };
    }

    return filter;
  }

  // ============================================
  // PROFILE COMPLETION UTILITIES
  // ============================================

  /**
   * Calculate profile completion percentage
   * @param {Object} profile - Candidate profile object
   * @returns {Object} - Completion info with percentage and missing sections
   */
  static calculateProfileCompletion(profile) {
    const requiredSections = {
      basic: { weight: 15, fields: ['fullName', 'title', 'summary'] },
      contact: { weight: 10, fields: ['email', 'phone'] },
      education: { weight: 20, fields: ['university'] },
      experience: { weight: 25, fields: ['internships'] },
      skills: { weight: 20, fields: ['technical'] },
      resume: { weight: 10, fields: ['current'] },
    };

    let totalScore = 0;
    let maxScore = 0;
    const missingSections = [];
    const completedSections = [];

    for (const [section, config] of Object.entries(requiredSections)) {
      maxScore += config.weight;
      const sectionData = profile[section];

      if (!sectionData) {
        missingSections.push(section);
        continue;
      }

      let sectionComplete = true;
      for (const field of config.fields) {
        if (
          !sectionData[field] ||
          (Array.isArray(sectionData[field]) && sectionData[field].length === 0)
        ) {
          sectionComplete = false;
          break;
        }
      }

      if (sectionComplete) {
        totalScore += config.weight;
        completedSections.push(section);
      } else {
        missingSections.push(section);
      }
    }

    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
      percentage,
      score: totalScore,
      maxScore,
      completedSections,
      missingSections,
      isComplete: percentage >= 80, // Consider 80% as complete
    };
  }

  // ============================================
  // ACTION VALIDATION UTILITIES
  // ============================================

  /**
   * Validate action parameters for unified endpoints
   * @param {string} action - Action to validate
   * @param {string[]} validActions - Array of valid actions
   * @returns {Object} - Validation result
   */
  static validateAction(action, validActions) {
    if (!action) {
      return {
        success: false,
        error: 'Action parameter is required',
      };
    }

    if (!validActions.includes(action)) {
      return {
        success: false,
        error: `Invalid action '${action}'. Valid actions: ${validActions.join(
          ', '
        )}`,
      };
    }

    return { success: true };
  }

  /**
   * Get required parameters for specific actions
   * @param {string} action - Action name
   * @param {string} endpoint - Endpoint type
   * @returns {string[]} - Array of required parameters
   */
  static getRequiredParams(action, endpoint) {
    const requirements = {
      recommendations: {
        'similar-jobs': ['job_id'],
        'career-paths': [],
        jobs: [],
        skills: [],
        courses: [],
      },
      matching: {
        score: ['job_id'],
        analysis: ['job_id'],
        fit: ['job_id'],
        compare: ['job_ids'],
      },
      resume: {
        analyze: [],
        optimize: [],
        score: [],
        'ats-check': [],
      },
      'resume-builder': {
        summary: [],
        bullets: ['data'],
        skills: [],
        tailor: ['job_id'],
      },
      career: {
        path: [],
        'skill-gap': [],
        learning: [],
      },
      interview: {
        prep: ['job_id'],
        mock: ['job_id', 'questions', 'answers'],
      },
    };

    return requirements[endpoint]?.[action] || [];
  }
}

module.exports = APIUtils;
