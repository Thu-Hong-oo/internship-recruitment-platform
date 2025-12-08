const mongoose = require('mongoose');
const { AppError } = require('../../../utils/errors');

class ResumeHelpers {
  /**
   * Auto-fill profile from parsed data
   */
  static async autoFillProfileFromParsedData(profile, extractedData) {
    try {
      // Update personal info if provided - ALWAYS UPDATE from new CV
      if (extractedData.personalInfo) {
        const { fullName, email, phone, address, dateOfBirth } = extractedData.personalInfo;

        // Always update from CV parse (user uploaded new CV = wants to update)
        if (fullName) {
          profile.personalInfo.fullName = fullName;
        }
        if (email) {
          profile.personalInfo.email = email;
        }
        if (phone) {
          profile.personalInfo.phone = phone;
        }
        if (dateOfBirth) {
          // Parse Vietnamese date format (DD/MM/YYYY) to ISO Date
          try {
            if (typeof dateOfBirth === 'string') {
              const dateMatch = dateOfBirth.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
              if (dateMatch) {
                const [_, day, month, year] = dateMatch;
                // MongoDB expects ISO format: YYYY-MM-DD
                const isoDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                if (!isNaN(isoDate.getTime())) {
                  profile.personalInfo.dateOfBirth = isoDate;
                } else {
                  console.warn(`⚠️ Invalid date value: ${dateOfBirth}`);
                }
              } else {
                // Try direct Date parse for other formats
                const parsedDate = new Date(dateOfBirth);
                if (!isNaN(parsedDate.getTime())) {
                  profile.personalInfo.dateOfBirth = parsedDate;
                }
              }
            } else if (dateOfBirth instanceof Date) {
              profile.personalInfo.dateOfBirth = dateOfBirth;
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse dateOfBirth: ${dateOfBirth}`, error.message);
          }
        }
        if (address) {
          // Parse address string to object format
          if (typeof address === 'string' && address.trim() !== '') {
            // Simple parsing: split by commas and extract city
            const parts = address.split(',').map(s => s.trim());
            profile.personalInfo.address = {
              street: parts[0] || '',
              ward: parts.length > 1 ? parts[1] : '',
              district: '',
              city: parts.length > 1 ? parts[parts.length - 1] : '',
              country: 'Vietnam'
            };
          } else if (typeof address === 'object' && address !== null) {
            profile.personalInfo.address = address;
          }
        }
      }

      // Update education if provided - ALWAYS UPDATE from new CV
      if (extractedData.education) {
        profile.education.university = extractedData.education;
        console.log(`📚 Updated education: ${extractedData.education.institution}`);
      }

      // Update skills if provided - CLEAR OLD and ADD NEW from CV
      if (extractedData.skills && extractedData.skills.length > 0) {
        // CLEAR all old auto-parsed skills (keep only manually verified ones)
        profile.skills.technical = (profile.skills.technical || []).filter(s => s.verified === true);
        profile.skills.soft = (profile.skills.soft || []).filter(s => s.verified === true);
        profile.skills.languages = (profile.skills.languages || []).filter(s => s.verified === true);

        console.log(`🗑️  Cleared old auto-parsed skills (kept ${profile.skills.technical.length + profile.skills.soft.length + profile.skills.languages.length} verified)`);

        // Build set of existing verified skills to avoid duplicates
        const verifiedSkills = new Set();
        ['technical', 'soft', 'languages'].forEach(category => {
          (profile.skills[category] || []).forEach(skill => {
            verifiedSkills.add(skill.name.toLowerCase().trim());
          });
        });

        // Add new skills from CV parse
        const addedCounts = { technical: 0, soft: 0, languages: 0 };
        
        extractedData.skills.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : (skill.name || skill);
          const skillType = typeof skill === 'object' ? (skill.type || 'technical') : 'technical';
          const skillLevel = typeof skill === 'object' ? (skill.level || 'intermediate') : 'intermediate';
          const skillLower = skillName.toLowerCase().trim();

          // Skip if already exists in verified skills
          if (verifiedSkills.has(skillLower)) {
            return;
          }

          // Determine target category
          let targetCategory;
          if (skillType === 'soft') {
            targetCategory = 'soft';
          } else if (skillType === 'language') {
            targetCategory = 'languages';
          } else {
            targetCategory = 'technical';
          }

          // Create new skill object
          const newSkill = {
            name: skillName,
            level: skillLevel,
            verified: false,
            endorsements: 0
          };

          if (targetCategory === 'technical') {
            newSkill.projects = [];
          }

          // Add to appropriate category
          if (!profile.skills[targetCategory]) {
            profile.skills[targetCategory] = [];
          }
          profile.skills[targetCategory].push(newSkill);
          addedCounts[targetCategory]++;
          verifiedSkills.add(skillLower); // Track to avoid duplicates
        });

        console.log(`➕ Added ${addedCounts.technical} technical, ${addedCounts.soft} soft, ${addedCounts.languages} language skills`);
      }

      // Update experience if provided - CLEAR OLD and ADD NEW from CV
      if (extractedData.experience && Array.isArray(extractedData.experience)) {
        // CLEAR all old experiences (no way to distinguish manual vs auto-parsed in old data)
        const oldCount = (profile.experience.internships || []).length;
        profile.experience.internships = [];
        
        if (oldCount > 0) {
          console.log(`🗑️  Cleared ${oldCount} old experience entries`);
        }
        
        // Helper: Parse date string "MM/YYYY" or "DD/MM/YYYY" to Date object
        const parseDate = (dateStr) => {
          if (!dateStr || typeof dateStr !== 'string') return null;
          
          // Remove extra spaces
          dateStr = dateStr.trim();
          
          // Format: "MM/YYYY" → new Date(YYYY, MM-1, 1)
          const mmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
          if (mmyyyyMatch) {
            const [, month, year] = mmyyyyMatch;
            return new Date(parseInt(year), parseInt(month) - 1, 1);
          }
          
          // Format: "DD/MM/YYYY" → new Date(YYYY, MM-1, DD)
          const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          
          // Format: "YYYY" → new Date(YYYY, 0, 1)
          const yyyyMatch = dateStr.match(/^(\d{4})$/);
          if (yyyyMatch) {
            return new Date(parseInt(dateStr), 0, 1);
          }
          
          // Fallback: Try native Date parsing
          const parsed = new Date(dateStr);
          return isNaN(parsed.getTime()) ? null : parsed;
        };
        
        // Add new parsed experiences with proper date conversion
        extractedData.experience.forEach(exp => {
          const newExp = {
            ...exp,
            manuallyAdded: false // Mark as auto-parsed for future updates
          };
          
          // Convert date strings to Date objects
          if (exp.startDate) {
            newExp.startDate = parseDate(exp.startDate);
          }
          if (exp.endDate) {
            newExp.endDate = parseDate(exp.endDate);
          }
          
          profile.experience.internships.push(newExp);
        });
        
        console.log(`➕ Added ${extractedData.experience.length} new experience entries from CV`);
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
    const { decodeFilename, normalizeFilename } = require('../../../utils/filenameEncoding');
    const decodedFilename = decodeFilename(file?.originalname || 'resume.pdf');
    const normalizedFilename = normalizeFilename(decodedFilename);
    
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      filename: uploadResult.filename || normalizedFilename,
      displayName: uploadResult.displayName || decodedFilename,
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
