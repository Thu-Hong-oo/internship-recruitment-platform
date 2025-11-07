class ValidationService {
  constructor() {
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    this.phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  }

  validateUser(userData) {
    const errors = [];

    // Email validation
    if (!userData.email || !this.emailRegex.test(userData.email)) {
      errors.push('Valid email is required');
    }

    // Password validation
    if (!userData.password || !this.passwordRegex.test(userData.password)) {
      errors.push(
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      );
    }

    // Role validation
    const validRoles = ['candidate', 'employer', 'admin'];
    if (!userData.role || !validRoles.includes(userData.role)) {
      errors.push('Valid role is required (candidate, employer, admin)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validatePassword(password) {
    const errors = [];

    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateEmail(email) {
    return this.emailRegex.test(email);
  }

  validatePhone(phone) {
    return this.phoneRegex.test(phone);
  }

  validateJob(jobData) {
    const errors = [];

    // Title validation
    if (!jobData.title || jobData.title.trim().length < 3) {
      errors.push('Job title must be at least 3 characters long');
    }

    // Description validation
    if (!jobData.description || jobData.description.trim().length < 50) {
      errors.push('Job description must be at least 50 characters long');
    }

    // Employment type validation
    const validEmploymentTypes = [
      'full_time',
      'FULL_TIME',
      'part_time',
      'PART_TIME',
      'contract',
      'CONTRACT',
      'internship',
      'INTERNSHIP',
      'freelance',
      'FREELANCE',
    ];
    if (
      !jobData.employmentType ||
      !validEmploymentTypes.includes(jobData.employmentType)
    ) {
      errors.push('Valid employment type is required');
    }

    // Experience level validation
    const validExperienceLevels = [
      'entry',
      'ENTRY',
      'junior',
      'JUNIOR',
      'mid',
      'MID',
      'senior',
      'SENIOR',
      'lead',
      'LEAD',
      'executive',
      'EXECUTIVE',
    ];
    if (
      !jobData.experienceLevel ||
      !validExperienceLevels.includes(jobData.experienceLevel)
    ) {
      errors.push('Valid experience level is required');
    }

    // Location validation
    if (!jobData.location || !jobData.location.city) {
      errors.push('Job location is required');
    }

    // Skills validation
    if (
      !jobData.skills ||
      !Array.isArray(jobData.skills) ||
      jobData.skills.length === 0
    ) {
      errors.push('At least one skill is required');
    }

    // Application deadline validation
    if (jobData.applicationDeadline) {
      const deadline = new Date(jobData.applicationDeadline);
      const now = new Date();
      if (deadline <= now) {
        errors.push('Application deadline must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateApplication(applicationData) {
    const errors = [];

    // Job ID validation
    if (!applicationData.jobId) {
      errors.push('Job ID is required');
    }

    // Candidate ID validation
    if (!applicationData.candidateId) {
      errors.push('Candidate ID is required');
    }

    // Cover letter validation
    if (
      applicationData.coverLetter &&
      applicationData.coverLetter.length > 2000
    ) {
      errors.push('Cover letter must be less than 2000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateCV(cvData) {
    const errors = [];

    // Candidate ID validation
    if (!cvData.candidateId) {
      errors.push('Candidate ID is required');
    }

    // File validation
    if (!cvData.originalName) {
      errors.push('File name is required');
    }

    if (!cvData.cloudinaryUrl) {
      errors.push('File URL is required');
    }

    // File size validation
    if (cvData.fileSize && cvData.fileSize > 10 * 1024 * 1024) {
      errors.push('File size must be less than 10MB');
    }

    // MIME type validation
    const validMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (cvData.mimeType && !validMimeTypes.includes(cvData.mimeType)) {
      errors.push(
        'Invalid file type. Only PDF, images, and Word documents are allowed'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateCompany(companyData) {
    const errors = [];

    // Name validation
    if (!companyData.name || companyData.name.trim().length < 2) {
      errors.push('Company name must be at least 2 characters long');
    }

    // Website validation
    if (companyData.website && !this.validateUrl(companyData.website)) {
      errors.push('Valid website URL is required');
    }

    // Size validation
    const validSizes = [
      'startup_1_10',
      'small_11_50',
      'medium_51_200',
      'large_201_1000',
      'enterprise_1000_plus',
    ];
    if (companyData.size && !validSizes.includes(companyData.size)) {
      errors.push('Valid company size is required');
    }

    // Description validation
    if (companyData.description && companyData.description.length > 1000) {
      errors.push('Company description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateProfile(profileData) {
    const errors = [];

    // Full name validation
    if (profileData.fullName && profileData.fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    // Phone validation
    if (profileData.phone && !this.validatePhone(profileData.phone)) {
      errors.push('Valid phone number is required');
    }

    // Bio validation
    if (profileData.bio && profileData.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    // Date of birth validation
    if (profileData.dateOfBirth) {
      const birthDate = new Date(profileData.dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();

      if (age < 16 || age > 100) {
        errors.push('Age must be between 16 and 100 years');
      }
    }

    // Gender validation
    const validGenders = ['male', 'female', 'other'];
    if (profileData.gender && !validGenders.includes(profileData.gender)) {
      errors.push('Valid gender is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  validateObjectId(id) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }

  validatePagination(page, limit) {
    const errors = [];

    if (page && (isNaN(page) || page < 1)) {
      errors.push('Page must be a positive number');
    }

    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateSearchQuery(query) {
    const errors = [];

    if (query && query.trim().length < 2) {
      errors.push('Search query must be at least 2 characters long');
    }

    if (query && query.length > 100) {
      errors.push('Search query must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateDateRange(startDate, endDate) {
    const errors = [];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        errors.push('Start date must be before end date');
      }

      if (start > new Date()) {
        errors.push('Start date cannot be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  sanitizeInput(input) {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    return input;
  }

  sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  validateSkill(skillData) {
    const errors = [];

    // Name validation
    if (!skillData.name || typeof skillData.name !== 'string') {
      errors.push('Skill name is required and must be a string');
    } else if (skillData.name.trim().length === 0) {
      errors.push('Skill name cannot be empty');
    } else if (skillData.name.length > 100) {
      errors.push('Skill name cannot exceed 100 characters');
    }

    // Slug validation
    if (!skillData.slug || typeof skillData.slug !== 'string') {
      errors.push('Skill slug is required and must be a string');
    } else if (skillData.slug.trim().length === 0) {
      errors.push('Skill slug cannot be empty');
    } else if (!/^[a-z0-9-]+$/.test(skillData.slug)) {
      errors.push(
        'Skill slug can only contain lowercase letters, numbers, and hyphens'
      );
    }

    // Description validation (optional)
    if (skillData.description && typeof skillData.description !== 'string') {
      errors.push('Skill description must be a string');
    } else if (skillData.description && skillData.description.length > 500) {
      errors.push('Skill description cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateSkillUpdate(updateData) {
    const errors = [];

    // Name validation (optional for updates)
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string') {
        errors.push('Skill name must be a string');
      } else if (updateData.name.trim().length === 0) {
        errors.push('Skill name cannot be empty');
      } else if (updateData.name.length > 100) {
        errors.push('Skill name cannot exceed 100 characters');
      }
    }

    // Slug validation (optional for updates)
    if (updateData.slug !== undefined) {
      if (typeof updateData.slug !== 'string') {
        errors.push('Skill slug must be a string');
      } else if (updateData.slug.trim().length === 0) {
        errors.push('Skill slug cannot be empty');
      } else if (!/^[a-z0-9-]+$/.test(updateData.slug)) {
        errors.push(
          'Skill slug can only contain lowercase letters, numbers, and hyphens'
        );
      }
    }

    // Description validation (optional)
    if (updateData.description !== undefined) {
      if (typeof updateData.description !== 'string') {
        errors.push('Skill description must be a string');
      } else if (updateData.description.length > 500) {
        errors.push('Skill description cannot exceed 500 characters');
      }
    }

    // Other field validations can be added here as needed

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = ValidationService;
