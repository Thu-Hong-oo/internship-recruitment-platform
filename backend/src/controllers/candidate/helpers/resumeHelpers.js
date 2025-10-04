const mongoose = require('mongoose');
const { AppError } = require('../../../utils/errors');

class ResumeHelpers {
  /**
   * Auto-fill profile from parsed data
   */
  static async autoFillProfileFromParsedData(profile, extractedData) {
    try {
      // Update personal info if provided
      if (extractedData.personalInfo) {
        const { fullName, email, phone, address } = extractedData.personalInfo;

        if (fullName && !profile.personalInfo.fullName) {
          profile.personalInfo.fullName = fullName;
        }
        if (email && !profile.personalInfo.email) {
          profile.personalInfo.email = email;
        }
        if (phone && !profile.personalInfo.phone) {
          profile.personalInfo.phone = phone;
        }
        if (address && !profile.personalInfo.address) {
          profile.personalInfo.address = address;
        }
      }

      // Update education if provided and not exists
      if (
        extractedData.education &&
        !profile.education.university?.institution
      ) {
        profile.education.university = extractedData.education;
      }

      // Update skills if provided
      if (extractedData.skills && extractedData.skills.length > 0) {
        if (!profile.skills.technical) profile.skills.technical = [];

        // Add only new skills that don't already exist
        const existingSkills = profile.skills.technical.map(s =>
          s.name?.toLowerCase()
        );
        const newSkills = extractedData.skills
          .filter(skill => !existingSkills.includes(skill.toLowerCase()))
          .map(skill => ({
            name: skill,
            level: 'intermediate', // Default level
            verified: false,
          }));

        profile.skills.technical.push(...newSkills);
      }

      // Update experience if provided
      if (extractedData.experience) {
        if (!profile.experience.internships)
          profile.experience.internships = [];
        profile.experience.internships.push(extractedData.experience);
      }

      console.log('✅ Profile auto-filled from parsed resume data');
    } catch (error) {
      console.warn('⚠️ Error auto-filling profile:', error.message);
    }
  }

  /**
   * Validate resume file
   */
  static validateResumeFile(file) {
    if (!file) {
      throw new AppError('No resume file provided', 400);
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(
        'Invalid file type. Only PDF, DOC, and DOCX files are allowed',
        400
      );
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new AppError('File size exceeds 5MB limit', 400);
    }

    return true;
  }

  /**
   * Get content type from file format
   */
  static getContentType(format) {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/pdf';
    }
  }

  /**
   * Prepare resume data for storage
   */
  static prepareResumeData(uploadResult, file) {
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      filename: uploadResult.filename || file.originalname,
      displayName: uploadResult.displayName || file.originalname,
      format: uploadResult.format,
      size: uploadResult.size || file.size,
      mimeType: uploadResult.mimeType || file.mimetype,
      uploadedAt: new Date(),
    };
  }

  /**
   * Update resume analytics
   */
  static updateResumeAnalytics(profile) {
    // Initialize analytics if not exists
    if (!profile.analytics) {
      profile.analytics = {};
    }
    if (!profile.analytics.resumeStats) {
      profile.analytics.resumeStats = {
        uploads: 0,
        lastUpload: null,
      };
    }

    profile.analytics.resumeStats.uploads += 1;
    profile.analytics.resumeStats.lastUpload = new Date();
  }

  /**
   * Save parsed data to resume
   */
  static saveParseResultToResume(profile, parseResult) {
    if (parseResult) {
      profile.resume.current.aiAnalysis = {
        extractedData: parseResult.extractedData || {},
        skills: parseResult.skills || [], // Simple string array
        suggestions: parseResult.suggestions || [],
        analyzedAt: new Date(),
      };
    } else {
      profile.resume.current.aiAnalysis = {
        error: 'Parsing failed during upload',
        analyzedAt: new Date(),
      };
    }
  }

  /**
   * Move current resume to history
   */
  static moveCurrentToHistory(profile) {
    if (profile.resume.current.url) {
      if (!profile.resume.history) profile.resume.history = [];
      profile.resume.history.push({
        ...profile.resume.current,
        uploadedAt: profile.resume.current.updatedAt,
      });
    }
  }

  /**
   * Prepare upload response
   */
  static prepareUploadResponse(uploadResult, profile) {
    return {
      upload: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        filename: uploadResult.filename,
        displayName: uploadResult.displayName,
        format: uploadResult.format,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadedAt: profile.resume.current.uploadedAt,
      },
      parsing: profile.resume.current.aiAnalysis,
    };
  }

  /**
   * Generate unique public ID for resume
   */
  static generatePublicId(userId) {
    return `resume_${userId}_${Date.now()}`;
  }

  /**
   * Validate resume generation parameters
   */
  static validateGenerationParams(template, targetJob) {
    const validTemplates = ['modern', 'classic', 'creative', 'professional'];

    if (template && !validTemplates.includes(template)) {
      throw new AppError(
        `Invalid template. Must be one of: ${validTemplates.join(', ')}`,
        400
      );
    }

    return {
      template: template || 'modern',
      targetJob: targetJob || null,
    };
  }

  /**
   * Check if resume exists
   */
  static validateResumeExists(profile) {
    if (!profile.resume?.current?.url) {
      throw new AppError('No resume found', 404);
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Validate file extension
   */
  static validateFileExtension(filename) {
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const extension = this.getFileExtension(filename);

    if (!allowedExtensions.includes(extension)) {
      throw new AppError(
        `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`,
        400
      );
    }

    return extension;
  }
}

module.exports = ResumeHelpers;
