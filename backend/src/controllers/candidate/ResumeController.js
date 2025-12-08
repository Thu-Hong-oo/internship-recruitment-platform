const mongoose = require('mongoose');
const CandidateProfile = require('../../models/CandidateProfile');
const uploadService = require('../../services/upload/unifiedUploadService');
const ProfileController = require('./ProfileController'); // Import ProfileController
const aiService = require('../../services/ai/aiService');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');
const { logger } = require('../../utils/logger');
const Job = require('../../models/Job'); // Import Job model

class ResumeController {
  constructor() {
    // Bind all methods to ensure 'this' context is preserved
    this.handleResume = this.handleResume.bind(this);
    this.getResume = this.getResume.bind(this);
    this.deleteResume = this.deleteResume.bind(this);
    this.setCurrentResume = this.setCurrentResume.bind(this);
    this.renameResume = this.renameResume.bind(this);
    this.viewCurrentCV = this.viewCurrentCV.bind(this);
    this.generateSmartResume = this.generateSmartResume.bind(this);
    this.generateTargetedResume = this.generateTargetedResume.bind(this);
    this.buildResumeContent = this.buildResumeContent.bind(this);
    this.formatAddress = this.formatAddress.bind(this);
    this.ensureCandidateProfile = this.ensureCandidateProfile.bind(this);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Ensure candidate profile exists, create if not found
   * @param {string} userId - User ID
   * @param {Object} user - User object from req.user
   * @returns {Promise<Object>} Candidate profile
   */
  async ensureCandidateProfile(userId, user) {
    let profile = await CandidateProfile.findOne({ userId });

    if (!profile) {
      console.log(`Creating new candidate profile for user: ${userId}`);
      profile = new CandidateProfile({
        userId: userId,
        personalInfo: {
          fullName: user.fullName || '',
          email: user.email || '',
          avatar: user.avatar || null,
        },
        progress: {
          profileCompleteness: 10,
          lastUpdated: new Date(),
        },
        status: 'active',
      });
      await profile.save();
      console.log(`✅ Created candidate profile for user: ${userId}`);
    } else {
      // Fix address field if it's corrupted (string instead of object)
      if (profile.personalInfo && profile.personalInfo.address !== undefined) {
        if (typeof profile.personalInfo.address === 'string') {
          console.log('🔧 Fixing corrupted address field in existing profile');
          const addressString = profile.personalInfo.address;

          if (addressString === '') {
            // Empty string - set to null
            profile.personalInfo.address = null;
          } else {
            // Non-empty string - convert to object
            profile.personalInfo.address = {
              street: '',
              ward: '',
              district: '',
              city: addressString,
              country: 'Vietnam',
            };
          }

          try {
            await profile.save();
            console.log('✅ Address field fixed successfully');
          } catch (error) {
            console.error('❌ Failed to fix address field:', error.message);
            // If save fails, set address to null to prevent further errors
            profile.personalInfo.address = null;
          }
        }
      }
    }
    return profile;
  }

  /**
   * Helper method to create a new resume entry object.
   * @param {Object} data - Resume data.
   * @param {boolean} isAI - Is AI generated?
   * @returns {Object} New resume object.
   */
  _createNewResumeEntry(data, isAI = false) {
    const { url, publicId, filename, displayName, format, size, mimeType } =
      data;
    return {
      _id: new mongoose.Types.ObjectId(),
      url,
      publicId,
      filename: filename || 'resume.pdf',
      displayName: displayName || filename || 'resume.pdf',
      format: format || 'pdf',
      size: size || 0,
      mimeType: mimeType || 'application/pdf',
      uploadedAt: new Date(),
      aiGenerated: isAI,
      aiAnalysis: data.aiAnalysis || {},
      targetJob: data.targetJob || null,
      template: data.template || null,
    };
  }

  /**
   * Consolidate logic for updating current resume and history.
   * @param {Object} profile - Candidate profile.
   * @param {Object} newResumeData - Data for the new current resume.
   * @param {boolean} shouldUpdateHistory - Whether to add old resume to history.
   * @param {boolean} shouldDeleteOldFile - Whether to delete old file on Cloudinary.
   */
  async _updateResumeInProfile(
    profile,
    newResumeData,
    shouldUpdateHistory = true,
    shouldDeleteOldFile = false // Đổi mặc định thành false - KHÔNG xóa file khi thêm vào history
  ) {
    try {
      // 1. Add old current resume to history (GIỮ LẠI FILE trên Cloudinary)
      if (
        shouldUpdateHistory &&
        profile.resume.current &&
        profile.resume.current.url
      ) {
        if (!profile.resume.history) profile.resume.history = [];
        profile.resume.history.push({
          ...profile.resume.current,
          _id: new mongoose.Types.ObjectId(), // Ensure new history item has a unique ID
          uploadedAt: profile.resume.current.updatedAt || new Date(),
        });
        logger.info(
          'Added old resume to history (file preserved on Cloudinary)',
          {
            publicId: profile.resume.current.publicId,
          }
        );
      }

      // 2. Delete old file from Cloudinary (CHỈ khi explicitly requested)
      // LƯU Ý: Không xóa file khi thêm vào history để user có thể xem lại
      // Chỉ xóa khi user xóa CV khỏi history hoặc khi thực sự cần thiết
      if (shouldDeleteOldFile && profile.resume.current.publicId) {
        try {
          logger.info(
            'Deleting old resume from Cloudinary (explicitly requested)',
            {
              publicId: profile.resume.current.publicId,
            }
          );
          await uploadService.deleteFile(profile.resume.current.publicId);
          logger.info('Old resume deleted from Cloudinary');
        } catch (deleteError) {
          logger.warn('Failed to delete old resume from Cloudinary', {
            error: deleteError.message,
            publicId: profile.resume.current.publicId,
          });
        }
      } else if (profile.resume.current.publicId) {
        logger.info(
          'Old resume file preserved on Cloudinary (available in history)',
          {
            publicId: profile.resume.current.publicId,
          }
        );
      }

      // 3. Fix address field if it's a string but code expects object
      if (profile.personalInfo && profile.personalInfo.address !== undefined) {
        if (typeof profile.personalInfo.address === 'string') {
          console.log(
            '🔧 Converting address string to object to prevent MongoDB error'
          );
          const addressString = profile.personalInfo.address;

          if (addressString === '') {
            // Empty string - set to null to avoid MongoDB error
            profile.personalInfo.address = null;
          } else {
            // Non-empty string - convert to object
            profile.personalInfo.address = {
              street: '',
              ward: '',
              district: '',
              city: addressString,
              country: 'Vietnam',
            };
          }
        }
      }

      // 4. Set the new resume as current
      profile.resume.current = {
        ...newResumeData,
        updatedAt: new Date(),
      };

      // 5. Update analytics
      if (!profile.analytics) profile.analytics = {};
      if (!profile.analytics.resumeStats)
        profile.analytics.resumeStats = { uploads: 0, lastUpload: null };
      profile.analytics.resumeStats.uploads += 1;
      profile.analytics.resumeStats.lastUpload = new Date();

      return profile.save();
    } catch (error) {
      console.error('❌ Error in _updateResumeInProfile:', error);
      throw error;
    }
  }

  /**
   * Helper: Format address
   * @param {Object|string|null} address - Address object or string
   * @returns {string} Formatted address
   */
  formatAddress(address) {
    if (!address || address === '' || address === null) return 'N/A';

    // If address is string, return as is
    if (typeof address === 'string') return address;

    // If address is object but empty, return N/A
    if (typeof address === 'object' && Object.keys(address).length === 0)
      return 'N/A';

    try {
      const { street, ward, district, city, country } = address;
      const addressParts = [street, ward, district, city, country].filter(
        Boolean
      );
      return addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
    } catch (error) {
      console.warn(
        '⚠️ Error formatting address:',
        error.message,
        'Address:',
        address
      );
      return 'N/A';
    }
  }

  // ============================================
  // RESUME MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * POST /api/candidates/me/resume
   * Handle resume operations: upload, parse
   */
  async handleResume(req, res, next) {
    try {
      req.setTimeout(300000); // 5 minutes
      res.setTimeout(300000);

      const action = req.body.action || req.query.action;
      console.log(`🎯 Resume action: ${action} for user ${req.user.id}`);

      switch (action) {
        case 'upload':
          return await this._uploadResume(req, res);
        case 'parse':
          return await this._parseAndUploadResume(req, res);
        default:
          throw new AppError('Invalid action. Must be: upload or parse', 400);
      }
    } catch (error) {
      // Pass error to global error handler
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/resume
   * Get resume data with flexible options
   */
  async getResume(req, res, next) {
    try {
      const { version, id, action } = req.query;
      const profile = await this.ensureCandidateProfile(req.user.id, req.user);

      if (id && action === 'download') {
        return this._downloadResume(profile, id, res);
      }

      const resumeData =
        version === 'all'
          ? {
              current: profile.resume.current,
              history: profile.resume.history || [],
            }
          : profile.resume.current;

      return ApiResponse.success(
        res,
        resumeData,
        'Resume data retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/candidates/me/resume/:id
   * Delete CV by ID
   */
  async deleteResume(req, res, next) {
    try {
      const { id } = req.params;
      const profile = await this.ensureCandidateProfile(req.user.id, req.user);

      let cvToDelete = null;
      let isCurrentCV = false;

      // Logic to find and remove CV from current or history
      if (id === 'current') {
        if (!profile.resume.current || !profile.resume.current.url) {
          throw new AppError('No current CV to delete', 404);
        }
        cvToDelete = profile.resume.current;
        isCurrentCV = true;
      } else {
        const cvIndex = profile.resume.history.findIndex(
          cv => cv._id.toString() === id
        );
        if (cvIndex === -1) {
          throw new AppError('CV not found', 404);
        }
        cvToDelete = profile.resume.history.splice(cvIndex, 1)[0];
      }

      // Delete file from Cloudinary if it has a publicId
      if (cvToDelete.publicId) {
        try {
          await uploadService.deleteFile(cvToDelete.publicId);
        } catch (deleteError) {
          console.warn(
            '⚠️ Failed to delete file from Cloudinary:',
            deleteError.message
          );
        }
      }

      // Update current CV if the deleted one was the current one
      if (isCurrentCV) {
        profile.resume.current = {};
      } else {
        if (
          profile.resume.current &&
          profile.resume.current.url === cvToDelete.url
        ) {
          if (profile.resume.history.length > 0) {
            const latestCV =
              profile.resume.history[profile.resume.history.length - 1];
            profile.resume.current = this._createNewResumeEntry(latestCV);
          } else {
            profile.resume.current = {};
          }
        }
      }

      await profile.save();

      return ApiResponse.success(
        res,
        { current: profile.resume.current, history: profile.resume.history },
        'CV deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/candidates/me/resume/set-current/:id
   * Set CV from history as current
   */
  async setCurrentResume(req, res, next) {
    try {
      const { id } = req.params;
      const profile = await this.ensureCandidateProfile(req.user.id, req.user);

      if (!profile.resume.history || !Array.isArray(profile.resume.history)) {
        throw new AppError('No resume history found', 404);
      }

      const cvIndex = profile.resume.history.findIndex(
        cv => cv._id.toString() === id
      );
      if (cvIndex === -1) {
        throw new AppError('CV not found in history', 404);
      }

      const selectedCV = profile.resume.history[cvIndex];
      profile.resume.history.splice(cvIndex, 1);

      const oldCurrentCV = profile.resume.current;
      if (oldCurrentCV && oldCurrentCV.url) {
        profile.resume.history.push(oldCurrentCV);
      }

      profile.resume.current = {
        ...selectedCV,
        _id: new mongoose.Types.ObjectId(),
        updatedAt: new Date(),
      };

      await profile.save();

      return ApiResponse.success(
        res,
        { current: profile.resume.current, history: profile.resume.history },
        'Current CV updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/candidates/me/resume/rename
   * Rename CV display name
   */
  async renameResume(req, res, next) {
    try {
      const { id, displayName } = req.body;

      if (
        !displayName ||
        typeof displayName !== 'string' ||
        !displayName.trim()
      ) {
        throw new AppError('Display name is required', 400);
      }

      if (!id) {
        throw new AppError('CV ID is required', 400);
      }

      const profile = await this.ensureCandidateProfile(req.user.id, req.user);

      const trimmedDisplayName = displayName.trim();
      let cvFound = false;

      if (
        profile.resume.current &&
        profile.resume.current._id &&
        profile.resume.current._id.toString() === id
      ) {
        profile.resume.current.displayName = trimmedDisplayName;
        cvFound = true;
      } else if (id === 'current' && profile.resume.current) {
        profile.resume.current.displayName = trimmedDisplayName;
        cvFound = true;
      }

      if (!cvFound && profile.resume.history) {
        const cvToRename = profile.resume.history.find(
          cv => cv._id.toString() === id
        );
        if (cvToRename) {
          cvToRename.displayName = trimmedDisplayName;
          if (
            profile.resume.current &&
            profile.resume.current.url === cvToRename.url
          ) {
            profile.resume.current.displayName = trimmedDisplayName;
          }
          cvFound = true;
        }
      }

      if (!cvFound) {
        throw new AppError('CV not found', 404);
      }

      await profile.save();

      return ApiResponse.success(
        res,
        { current: profile.resume.current, history: profile.resume.history },
        'CV renamed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/resume/view/:id?
   * Stream CV for viewing in browser
   */
  async viewCurrentCV(req, res, next) {
    try {
      const { id } = req.params;
      const profile = await this.ensureCandidateProfile(req.user.id, req.user);

      let resumeToView = null;
      if (!id || id === 'current') {
        if (!profile.resume.current || !profile.resume.current.url) {
          throw new AppError('No current CV to view', 404);
        }
        resumeToView = profile.resume.current;
      } else {
        if (!profile.resume.history || !Array.isArray(profile.resume.history)) {
          throw new AppError('No resume history found', 404);
        }
        const foundCV = profile.resume.history.find(
          cv => cv._id.toString() === id
        );
        if (!foundCV) {
          throw new AppError('CV not found in history', 404);
        }
        resumeToView = foundCV;
      }

      if (!resumeToView) {
        throw new AppError('CV not found', 404);
      }

      // Ưu tiên dùng URL gốc từ database (có version chính xác)
      // Nếu URL gốc không hợp lệ, mới generate từ publicId
      let accessibleUrl = null;

      if (resumeToView.url) {
        // Dùng URL gốc từ database (đảm bảo version chính xác)
        accessibleUrl = resumeToView.url.replace('http://', 'https://');
        // Fix URL format cho PDF files nếu cần
        if (
          accessibleUrl.includes('/image/upload/') &&
          (accessibleUrl.includes('.pdf') ||
            resumeToView.mimeType === 'application/pdf')
        ) {
          accessibleUrl = accessibleUrl.replace(
            '/image/upload/',
            '/raw/upload/'
          );
        }
        logger.info('Using original URL from database', {
          url: accessibleUrl,
          hasPublicId: !!resumeToView.publicId,
        });
      } else if (resumeToView.publicId) {
        // Fallback: generate URL từ publicId nếu không có URL gốc
        try {
          const { cloudinary } = require('../../utils/cloudinary');
          // Generate URL không có version (Cloudinary sẽ tự động dùng latest)
          accessibleUrl = cloudinary.url(resumeToView.publicId, {
            resource_type: 'raw', // PDF files nên dùng raw
            secure: true,
            // Không thêm version để Cloudinary tự động dùng latest
          });
          logger.info('Generated Cloudinary URL from publicId (no version)', {
            publicId: resumeToView.publicId,
            generatedUrl: accessibleUrl,
          });
        } catch (cloudinaryError) {
          logger.error('Failed to generate Cloudinary URL from publicId', {
            error: cloudinaryError.message,
            publicId: resumeToView.publicId,
          });
        }
      }

      if (!accessibleUrl) {
        throw new AppError('CV URL not found or invalid', 404);
      }

      logger.info('Fetching CV from URL', {
        url: accessibleUrl,
        cvId: id || 'current',
        hasPublicId: !!resumeToView.publicId,
      });

      // Fetch CV với timeout và fallback
      let response;
      let finalUrl = accessibleUrl;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        response = await fetch(finalUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Nếu URL gốc trả về 404 và có publicId, thử generate URL mới (không version)
        if (!response.ok && response.status === 404 && resumeToView.publicId) {
          logger.warn(
            'Original URL returned 404, trying to generate from publicId',
            {
              originalUrl: finalUrl,
              publicId: resumeToView.publicId,
            }
          );

          try {
            const { cloudinary } = require('../../utils/cloudinary');
            // Generate URL không có version để Cloudinary tự động dùng latest
            const fallbackUrl = cloudinary.url(resumeToView.publicId, {
              resource_type: 'raw',
              secure: true,
              // Không thêm version - Cloudinary sẽ tự động dùng latest
            });

            logger.info('Trying fallback URL from publicId', {
              fallbackUrl,
              publicId: resumeToView.publicId,
            });

            // Thử lại với fallback URL
            const fallbackController = new AbortController();
            const fallbackTimeoutId = setTimeout(
              () => fallbackController.abort(),
              10000
            );

            response = await fetch(fallbackUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0',
              },
              signal: fallbackController.signal,
            });

            clearTimeout(fallbackTimeoutId);
            finalUrl = fallbackUrl;

            if (response.ok) {
              logger.info('Fallback URL succeeded', {
                fallbackUrl,
              });
            }
          } catch (fallbackError) {
            logger.error('Fallback URL also failed', {
              error: fallbackError.message,
              publicId: resumeToView.publicId,
            });
          }
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          logger.error('CV fetch timeout', {
            url: finalUrl,
            timeout: '10s',
          });
          throw new AppError(
            'CV fetch timeout. The file may be too large or the server is slow.',
            504
          );
        }
        logger.error('Failed to fetch CV from URL', {
          error: fetchError.message,
          url: finalUrl,
        });
        throw new AppError(`Failed to fetch CV: ${fetchError.message}`, 502);
      }

      if (!response.ok) {
        logger.error(
          'CV URL returned error (both original and fallback failed)',
          {
            status: response.status,
            statusText: response.statusText,
            originalUrl: accessibleUrl,
            finalUrl,
            publicId: resumeToView.publicId,
          }
        );
        throw new AppError(
          `Failed to fetch CV: ${response.status} ${response.statusText}. The file may have been deleted or moved.`,
          502
        );
      }

      const fileBuffer = Buffer.from(await response.arrayBuffer());
      const contentType = resumeToView.mimeType || 'application/pdf';
      const filename =
        resumeToView.displayName || resumeToView.filename || 'resume.pdf';

      // Encode filename to handle special characters (Vietnamese, etc.)
      const encodedFilename = encodeURIComponent(filename);

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="resume.pdf"; filename*=UTF-8''${encodedFilename}`
      );
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate AI-enhanced resume from profile
   */
  async generateSmartResume(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        template = 'modern',
        targetJob = null,
        format = 'html',
      } = req.body;

      const profile = await this.ensureCandidateProfile(userId, req.user);
      const resumeContent = this.buildResumeContent(profile, { targetJob });
      const generatedResume = await aiService.generateResume(resumeContent, {
        template,
        targetJob,
        format,
      });

      const newResumeEntry = this._createNewResumeEntry(
        {
          url: generatedResume.url,
          publicId: generatedResume.publicId,
          filename: `AI_Generated_CV_${Date.now()}.${format}`,
          displayName: `CV AI - ${targetJob || 'General'}`,
          format,
          size: generatedResume.size,
          aiAnalysis: generatedResume.enhancedContent?.optimization,
          targetJob,
          template,
        },
        true
      );

      await this._updateResumeInProfile(profile, newResumeEntry);

      return ApiResponse.success(
        res,
        {
          resume: newResumeEntry,
          profile: {
            current: profile.resume.current,
            history: profile.resume.history,
          },
        },
        'AI-enhanced resume generated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate AI-enhanced resume targeted for specific job
   */
  async generateTargetedResume(req, res, next) {
    try {
      const { jobId } = req.params;
      const { template = 'modern', format = 'html' } = req.body;

      const job = await Job.findById(jobId);
      if (!job) {
        throw new AppError('Job not found', 404);
      }

      const profile = await this.ensureCandidateProfile(req.user.id, req.user);
      const resumeContent = this.buildResumeContent(profile, {
        targetJob: job.title,
        jobDescription: job.description,
        jobRequirements: job.requirements,
      });

      const generatedResume = await aiService.generateResume(resumeContent, {
        template,
        targetJob: job.title,
        format,
      });

      const newResumeEntry = this._createNewResumeEntry(
        {
          url: generatedResume.url,
          publicId: generatedResume.publicId,
          filename: `AI_CV_${job.title.replace(
            /[^a-zA-Z0-9]/g,
            '_'
          )}_${Date.now()}.${format}`,
          displayName: `CV AI - ${job.title}`,
          format,
          size: generatedResume.size,
          aiAnalysis: generatedResume.enhancedContent?.optimization,
          targetJob: job.title,
          template,
        },
        true
      );

      await this._updateResumeInProfile(profile, newResumeEntry);

      return ApiResponse.success(
        res,
        {
          resume: newResumeEntry,
          job: { id: job._id, title: job.title },
          profile: {
            current: profile.resume.current,
            history: profile.resume.history,
          },
        },
        'Targeted resume generated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build resume content from candidate profile
   */
  buildResumeContent(profile, options = {}) {
    const { targetJob, jobDescription, jobRequirements } = options;

    return {
      personalInfo: {
        fullName: profile.personalInfo?.fullName || 'N/A',
        email: profile.userId?.email || 'N/A',
        phone: profile.personalInfo?.phone || 'N/A',
        address: this.formatAddress(profile.personalInfo?.address),
        bio: profile.personalInfo?.bio || '',
        avatar: profile.personalInfo?.avatar,
      },
      education: profile.education || [],
      experience: profile.experience || [],
      skills: {
        technical: profile.skills?.technical || [],
        soft: profile.skills?.soft || [],
        languages: profile.skills?.languages || [],
      },
      projects: profile.projects || [],
      certifications: profile.certifications || [],
      targetJob: targetJob,
      jobDescription: jobDescription,
      jobRequirements: jobRequirements,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Helper for uploading resume file
   */
  async _uploadResume(req, res) {
    if (!req.file) {
      throw new AppError('No resume file provided', 400);
    }
    const profile = await this.ensureCandidateProfile(req.user.id, req.user);
    const uploadResult = await uploadService.uploadFile({
      file: req.file,
      type: 'resume',
      userId: req.user.id,
      publicId: `resume_${req.user.id}_${Date.now()}`,
    });

    const newResumeEntry = this._createNewResumeEntry({
      ...uploadResult,
      filename: req.file.originalname,
      displayName: req.file.originalname,
    });

    // KHÔNG xóa file cũ khi upload CV mới - giữ lại trong history để user có thể xem
    await this._updateResumeInProfile(profile, newResumeEntry, true, false);

    return ApiResponse.success(
      res,
      profile.resume.current,
      'Resume uploaded successfully'
    );
  }

  /**
   * Helper for parsing and uploading resume
   */
  async _parseAndUploadResume(req, res) {
    if (!req.file) {
      throw new AppError('No resume file provided for parsing', 400);
    }

    const profile = await this.ensureCandidateProfile(req.user.id, req.user);
    let parseResult;

    // Step 1: Parse CV (phần quan trọng nhất - cần trả về ngay)
    try {
      parseResult = await aiService.parseResumeFromBuffer(
        req.file.buffer,
        req.file.mimetype
      );
      console.log('✅ Successfully parsed resume from buffer');
    } catch (parseError) {
      console.warn('❌ Failed to parse from buffer:', parseError.message);

      // Fallback to rule-based parsing if AI fails
      if (process.env.ALLOW_RULE_BASED_FALLBACK === 'true') {
        console.log('🔄 Attempting rule-based parsing as fallback...');
        try {
          const ruleBasedParser = require('../../services/ai/ruleBasedCVParser');
          parseResult = await ruleBasedParser.parseCV(
            req.file.buffer,
            req.file.mimetype
          );
          console.log('✅ Rule-based parsing succeeded');
        } catch (ruleBasedError) {
          console.error(
            '❌ Rule-based parsing also failed:',
            ruleBasedError.message
          );
          parseResult = null;
        }
      } else {
        parseResult = null;
      }
    }

    // TỐI ƯU: Trả response ngay sau khi parsing xong (không đợi upload)
    // Upload và update sẽ chạy ở background
    const parsingResponse = {
      parsing: parseResult
        ? {
            extractedData: parseResult.extractedData || {},
            skills: parseResult.skills || [],
            suggestions: parseResult.suggestions || [],
            analyzedAt: new Date(),
          }
        : { error: 'Parsing failed', analyzedAt: new Date() },
      upload: {
        status: 'processing',
        message:
          'File is being uploaded in background. Use GET /api/candidates/me/resume to check upload status.',
      },
    };

    // Trả response ngay lập tức (chỉ sau parsing, không đợi upload)
    ApiResponse.success(
      res,
      parsingResponse,
      'Resume parsed successfully. Upload in progress...'
    );

    // Step 2: Upload, update profile và các tasks khác ở background (không block response)
    setImmediate(async () => {
      try {
        console.log('📤 Starting background upload...');

        // Upload file
        const uploadResult = await uploadService.uploadFile({
          file: req.file,
          type: 'resume',
          userId: req.user.id,
          publicId: `resume_${req.user.id}_${Date.now()}`,
        });
        console.log('✅ File uploaded successfully (background)');

        const newResumeEntry = this._createNewResumeEntry({
          ...uploadResult,
          filename: req.file.originalname,
          displayName: req.file.originalname,
          aiAnalysis: parseResult
            ? {
                extractedData: parseResult.extractedData || {},
                skills: parseResult.skills || [],
                suggestions: parseResult.suggestions || [],
                analyzedAt: new Date(),
              }
            : { error: 'Parsing failed during upload', analyzedAt: new Date() },
        });

        // Update profile với resume mới
        await this._updateResumeInProfile(profile, newResumeEntry, true, false);
        console.log('✅ Profile update completed (background)');

        // Profile auto-fill
        if (parseResult && parseResult.extractedData) {
          try {
            console.log(
              '🚀 Triggering profile auto-fill from parsed data (background)...'
            );
            const profileController = new ProfileController();
            await profileController.mapParsedCVToProfile(profile);
            console.log('✅ Profile auto-fill process completed.');
          } catch (error) {
            console.error('❌ Profile auto-fill FAILED:', error);
            console.warn(
              '⚠️ Profile auto-fill failed (non-blocking):',
              error.message
            );
          }
        }

        // Training data collection
        if (parseResult && parseResult.extractedData) {
          try {
            const TrainingData = require('../../models/TrainingData');
            const trainingData = {
              type: 'cv_parsing',
              input: req.file.buffer.toString('utf-8'),
              output: parseResult.extractedData || parseResult,
              metadata: {
                source: 'api_response',
                timestamp: new Date(),
                quality: 0.8,
                verified: false,
                userId: req.user.id,
              },
            };
            await TrainingData.create(trainingData);
            console.log('📊 CV parsing training data collected (background)');
          } catch (error) {
            console.warn(
              '⚠️ Training data collection failed (non-blocking):',
              error.message
            );
          }
        }
      } catch (error) {
        console.error('❌ Background upload/update failed:', error.message);
        // Log error nhưng không throw (vì response đã được gửi)
        // Có thể log vào database để retry sau
      }
    });
  }

  /**
   * Helper for downloading resume
   */
  _downloadResume(profile, id, res) {
    let cvToDownload = null;
    if (id === 'current') {
      if (!profile.resume.current || !profile.resume.current.url) {
        throw new AppError('Current resume not found', 404);
      }
      cvToDownload = profile.resume.current;
    } else {
      if (!profile.resume.history || !Array.isArray(profile.resume.history)) {
        throw new AppError('Resume history not found', 404);
      }
      const foundCV = profile.resume.history.find(
        cv => cv._id.toString() === id
      );
      if (!foundCV) {
        throw new AppError('Resume not found in history', 404);
      }
      cvToDownload = foundCV;
    }

    if (!cvToDownload || !cvToDownload.url) {
      throw new AppError('Resume URL not found', 404);
    }

    const filename =
      cvToDownload.filename || cvToDownload.displayName || 'resume.pdf';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', cvToDownload.mimeType || 'application/pdf');
    res.redirect(cvToDownload.url);
  }
}

module.exports = ResumeController;
