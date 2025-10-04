const mongoose = require('mongoose');
const CandidateProfile = require('../../models/CandidateProfile');
const uploadService = require('../../services/unifiedUploadService');
const aiService = require('../../services/aiService');
const {
  parseResume,
  generateResume,
} = require('../../services/resumeGeneratorService');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');

// For Node.js versions that don't have fetch globally
// const fetch = require('node-fetch');

class ResumeController {
  constructor() {
    // Bind các phương thức để đảm bảo ngữ cảnh this không bị mất khi được gọi trong router.
    this.handleResume = this.handleResume.bind(this);
    this.getResume = this.getResume.bind(this);
    this.deleteResume = this.deleteResume.bind(this);
    this.setCurrentResume = this.setCurrentResume.bind(this);
    this.renameResume = this.renameResume.bind(this);
    this.viewCurrentCV = this.viewCurrentCV.bind(this);
  }

  // ============================================
  // RESUME MANAGEMENT
  // ============================================

  /**
   * POST /api/candidates/me/resume
   * Handle resume operations: upload, parse, generate
   * Body: FormData { file, action: "upload" | "parse" }
   * Query: ?action=generate (AI generate)
   */
  async handleResume(req, res, next) {
    try {
      const action = req.body.action || req.query.action;

      switch (action) {
        case 'upload':
          return await this._uploadResume(req, res, next);
        case 'parse':
          return await this._parseResume(req, res, next);
        case 'generate':
          return await this._generateResume(req, res, next);
        default:
          throw new AppError(
            'Invalid action. Must be: upload, parse, or generate',
            400
          );
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/resume
   * Get resume data with flexible options
   * Query: ?version=all (để lấy currnt và history)| ?id=xxx&action=download
   * Hỗ trợ download nếu có id và action=download
   */
  async getResume(req, res, next) {
    try {
      const { version, id, action } = req.query;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      // Handle download action
      if (id && action === 'download') {
        return this._downloadResume(profile, id, res);
      }

      // Return resume data
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
   * Delete CV by ID (can be current CV or history CV)
   * If id = "current", delete current CV
   * Otherwise, delete CV from history by ID
   */
  async deleteResume(req, res, next) {
    try {
      const { id } = req.params;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      let cvToDelete = null;
      let isCurrentCV = false;

      // Check if deleting current CV
      if (id === 'current') {
        if (!profile.resume.current || !profile.resume.current.url) {
          throw new AppError('No current CV to delete', 404);
        }
        cvToDelete = profile.resume.current;
        isCurrentCV = true;
      } else {
        // Find CV in history by ID
        const cvIndex = profile.resume.history.findIndex(
          cv => cv._id.toString() === id
        );

        if (cvIndex === -1) {
          throw new AppError('CV not found', 404);
        }

        cvToDelete = profile.resume.history[cvIndex];

        // Remove from history
        profile.resume.history.splice(cvIndex, 1);
      }

      // Delete from Cloudinary if exists
      if (cvToDelete.publicId) {
        try {
          await uploadService.deleteFile(cvToDelete.publicId);
        } catch (deleteError) {
          console.warn(
            'Failed to delete file from Cloudinary:',
            deleteError.message
          );
        }
      }

      if (isCurrentCV) {
        // Clear current resume
        profile.resume.current = {};
      } else {
        // If deleted CV was also current, set current to empty or latest history
        if (
          profile.resume.current &&
          profile.resume.current.url === cvToDelete.url
        ) {
          if (profile.resume.history.length > 0) {
            // Set latest history as current
            const latestCV =
              profile.resume.history[profile.resume.history.length - 1];
            profile.resume.current = {
              _id: new mongoose.Types.ObjectId(),
              url: latestCV.url,
              publicId: latestCV.publicId,
              filename: latestCV.filename || 'resume.pdf',
              displayName:
                latestCV.displayName || latestCV.filename || 'resume.pdf',
              format: latestCV.format || 'pdf',
              size: latestCV.size || 0,
              mimeType: latestCV.mimeType || 'application/pdf',
              updatedAt: new Date(),
              aiAnalysis: profile.resume.current.aiAnalysis || {
                skills: [],
                suggestions: [],
                detailedSkills: [],
              },
            };
          } else {
            // No history left, clear current
            profile.resume.current = {};
          }
        }
      }

      await profile.save();

      return ApiResponse.success(
        res,
        {
          current: profile.resume.current,
          history: profile.resume.history,
        },
        'CV deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/candidates/me/resume/set-current/:id
   * Set CV from history as current by ID (swap current ↔ history)
   */
  async setCurrentResume(req, res, next) {
    try {
      const { id } = req.params;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      if (!profile.resume.history || !Array.isArray(profile.resume.history)) {
        throw new AppError('No resume history found', 404);
      }

      // Find CV in history by ID
      const cvIndex = profile.resume.history.findIndex(
        cv => cv._id.toString() === id
      );

      if (cvIndex === -1) {
        throw new AppError('CV not found in history', 404);
      }

      const selectedCV = profile.resume.history[cvIndex];

      // Preserve current AI analysis if exists
      let currentAiAnalysis = {
        skills: [],
        suggestions: [],
        detailedSkills: [],
      };

      if (profile.resume.current && profile.resume.current.aiAnalysis) {
        currentAiAnalysis = {
          skills: profile.resume.current.aiAnalysis.skills || [],
          suggestions: profile.resume.current.aiAnalysis.suggestions || [],
          detailedSkills:
            profile.resume.current.aiAnalysis.detailedSkills || [],
        };
      }

      // If current CV exists, move it to history first
      if (profile.resume.current && profile.resume.current.url) {
        // Add current CV to history (if not already there)
        const currentExistsInHistory = profile.resume.history.some(
          cv => cv.url === profile.resume.current.url
        );

        if (!currentExistsInHistory) {
          profile.resume.history.push({
            url: profile.resume.current.url,
            publicId: profile.resume.current.publicId,
            filename: profile.resume.current.filename,
            displayName: profile.resume.current.displayName,
            format: profile.resume.current.format,
            size: profile.resume.current.size,
            mimeType: profile.resume.current.mimeType,
            uploadedAt: profile.resume.current.updatedAt,
          });
        }
      }

      // Remove selected CV from history (since it will become current)
      profile.resume.history.splice(cvIndex, 1);

      // Set selected CV as current
      profile.resume.current = {
        _id: new mongoose.Types.ObjectId(), // Add ID for current CV
        url: selectedCV.url,
        publicId: selectedCV.publicId,
        filename: selectedCV.filename || 'resume.pdf',
        displayName:
          selectedCV.displayName || selectedCV.filename || 'resume.pdf',
        format: selectedCV.format || 'pdf',
        size: selectedCV.size || 0,
        mimeType: selectedCV.mimeType || 'application/pdf',
        updatedAt: new Date(),
        aiAnalysis: currentAiAnalysis,
      };

      await profile.save();

      return ApiResponse.success(
        res,
        {
          current: profile.resume.current,
          history: profile.resume.history,
          message: 'CV đã được đặt làm hiện tại',
        },
        'Current CV updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/candidates/me/resume/rename
   * Rename CV display name by ID (current or history)
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

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      const trimmedDisplayName = displayName.trim();
      let cvFound = false;

      // Check if it's current CV (by URL match since current might not have ID)
      if (profile.resume.current && profile.resume.current.url) {
        // If current CV has ID and matches, or if no ID but we're renaming current
        if (
          profile.resume.current._id &&
          profile.resume.current._id.toString() === id
        ) {
          profile.resume.current.displayName = trimmedDisplayName;
          cvFound = true;
        } else if (
          (!profile.resume.current._id ||
            profile.resume.current._id === null) &&
          id === 'current'
        ) {
          // Handle case where current CV doesn't have ID yet
          profile.resume.current.displayName = trimmedDisplayName;
          cvFound = true;
        }
      }

      // Check history CVs
      if (!cvFound && profile.resume.history) {
        const cvIndex = profile.resume.history.findIndex(
          cv => cv._id.toString() === id
        );

        if (cvIndex !== -1) {
          profile.resume.history[cvIndex].displayName = trimmedDisplayName;

          // If this history item is also current (same URL), update current too
          if (
            profile.resume.current &&
            profile.resume.current.url &&
            profile.resume.current.url === profile.resume.history[cvIndex].url
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
        {
          current: profile.resume.current,
          history: profile.resume.history,
        },
        'CV renamed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/resume/view
   * Redirect to CV for viewing in browser
   */
  /**
   * GET /api/candidates/me/resume/view
   * Stream current CV inline for viewing in browser
   */
  async viewCurrentCV(req, res, next) {
    try {
      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      console.log('🔍 Profile resume data:', {
        current: profile?.resume?.current,
        historyLength: profile?.resume?.history?.length || 0,
      });

      const currentResume = profile?.resume?.current;
      const url = currentResume?.url;
      const publicId = currentResume?.publicId;

      if (!url) {
        throw new AppError('Chưa có CV hiện tại để xem', 404);
      }

      try {
        // Get accessible URL for viewing
        let accessibleUrl = url;

        // Fix HTTPS for Cloudinary URLs
        if (accessibleUrl.startsWith('http://res.cloudinary.com')) {
          accessibleUrl = accessibleUrl.replace('http://', 'https://');
          console.log('🔒 Fixed to HTTPS:', accessibleUrl);
        }

        // Convert image/upload to raw/upload for PDF files (like old controller)
        if (url.includes('/image/upload/') && url.includes('.pdf')) {
          const rawUrl = url.replace('/image/upload/', '/raw/upload/');
          accessibleUrl = rawUrl;
        }

        let fileBuffer;

        try {
          // Use fetch directly like the old controller
          const response = await fetch(accessibleUrl);
          console.log(
            '🌐 Fetch response status:',
            response.status,
            response.statusText
          );

          // Accept 200 and 401 status codes like old controller
          if (response.status !== 200 && response.status !== 401) {
            throw new AppError(
              `Không thể tải CV từ Cloudinary: ${response.status} ${response.statusText}`,
              502
            );
          }

          const arrayBuffer = await response.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
          console.log('✅ Successfully fetched CV, size:', fileBuffer.length);
        } catch (fetchError) {
          console.error('❌ Error fetching CV:', fetchError);
          throw new AppError('Lỗi khi tải CV', 500);
        }

        // Get filename và format từ current resume
        const filename = profile.resume.current.filename || 'resume.pdf';
        const format = profile.resume.current.format || 'pdf';

        console.log('📋 File info:', {
          filename,
          format,
          size: fileBuffer.length,
        });

        // Set content type dựa trên format - QUAN TRỌNG để browser hiển thị đúng
        let contentType = 'application/pdf';
        if (format.toLowerCase() === 'pdf') {
          contentType = 'application/pdf';
        } else if (format.toLowerCase() === 'doc') {
          contentType = 'application/msword';
        } else if (format.toLowerCase() === 'docx') {
          contentType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        // Set headers để browser hiển thị INLINE thay vì download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Cho phép iframe từ cùng origin

        console.log('✅ Successfully fetched CV, size:', fileBuffer.length);
        res.send(fileBuffer);
      } catch (streamError) {
        console.error('❌ Error streaming CV:', streamError);
        throw new AppError('Lỗi khi tải CV', 500);
      }
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Upload resume helper
   */
  async _uploadResume(req, res, next) {
    if (!req.file) {
      throw new AppError('No resume file provided', 400);
    }

    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile) {
      throw new AppError('Candidate profile not found', 404);
    }

    // Upload resume using unified upload service
    const result = await uploadService.uploadFile({
      file: req.file,
      type: 'resume',
      userId: req.user.id,
      publicId: `resume_${req.user.id}_${Date.now()}`,
    });

    // Delete old resume if exists
    if (profile.resume.current.url && profile.resume.current.publicId) {
      try {
        await uploadService.deleteFile(profile.resume.current.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete old resume:', deleteError.message);
      }
    }

    // Update resume history if current exists
    if (profile.resume.current.url) {
      if (!profile.resume.history) profile.resume.history = [];
      profile.resume.history.push({
        url: profile.resume.current.url,
        publicId: profile.resume.current.publicId,
        filename: profile.resume.current.filename,
        displayName: profile.resume.current.displayName,
        format: profile.resume.current.format,
        size: profile.resume.current.size,
        mimeType: profile.resume.current.mimeType,
        uploadedAt: profile.resume.current.updatedAt,
      });
    }

    // Set new resume as current
    profile.resume.current = {
      _id: new mongoose.Types.ObjectId(), // Add ID for current CV
      url: result.url,
      publicId: result.publicId,
      filename: req.file.originalname,
      displayName: req.file.originalname,
      format: result.format,
      size: result.bytes,
      mimeType: result.mimeType,
      updatedAt: new Date(),
    };

    await profile.save();

    return ApiResponse.success(
      res,
      profile.resume.current,
      'Resume uploaded successfully'
    );
  }

  /**
   * Parse resume helper
   */
  async _parseResume(req, res, next) {
    if (!req.file) {
      throw new AppError('No resume file provided for parsing', 400);
    }

    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile) {
      throw new AppError('Candidate profile not found', 404);
    }

    // Parse the file buffer BEFORE uploading to avoid URL access issues
    console.log('📝 Parsing resume from file buffer directly');
    let parseResult;
    try {
      // Parse directly from file buffer
      parseResult = await aiService.parseResumeFromBuffer(
        req.file.buffer,
        req.file.mimetype
      );
      console.log('✅ Successfully parsed resume from buffer');
      console.log(
        '👤 Extracted name:',
        parseResult?.extractedData?.personalInfo?.fullName || 'Not found'
      );
    } catch (parseError) {
      console.warn('❌ Failed to parse from buffer:', parseError.message);
      // Continue with upload anyway, just without parsing
      parseResult = null;
    }

    // Upload resume using unified upload service
    const result = await uploadService.uploadFile({
      file: req.file,
      type: 'resume',
      userId: req.user.id,
      publicId: `resume_${req.user.id}_${Date.now()}`,
    });

    // Delete old resume if exists
    if (profile.resume.current.url && profile.resume.current.publicId) {
      try {
        await uploadService.deleteFile(profile.resume.current.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete old resume:', deleteError.message);
      }
    }

    // Update profile with new resume data
    profile.resume.current = {
      url: result.url,
      publicId: result.publicId,
      filename: result.filename,
      displayName: result.displayName,
      format: result.format,
      size: result.size,
      mimeType: result.mimeType,
      uploadedAt: new Date(),
    };

    // Update profile with parsed data (if parsing was successful)
    if (parseResult) {
      profile.resume.current.aiAnalysis = {
        extractedData: parseResult.extractedData || {},
        skills: parseResult.skills || [], // Simple string array
        suggestions: parseResult.suggestions || [],
        analyzedAt: new Date(),
      };

      // Save profile first to ensure aiAnalysis is persisted
      await profile.save();

      // Always auto-populate main profile fields from parsed CV data
      console.log('🔄 Starting profile mapping from aiAnalysis...');
      const ProfileController = require('./ProfileController');
      const profileController = new ProfileController();
      const mappingResult = await profileController.mapParsedCVToProfile(
        profile
      );
      console.log(
        '✅ Profile mapping completed:',
        mappingResult ? 'Success' : 'Failed'
      );
    } else {
      console.log('⚠️ Resume parsing failed, saved without AI analysis');
      profile.resume.current.aiAnalysis = {
        error: 'Parsing failed during upload',
        analyzedAt: new Date(),
      };
    }

    // Update analytics - Initialize if not exists
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

    await profile.save();

    return ApiResponse.success(
      res,
      {
        upload: {
          url: result.url,
          publicId: result.publicId,
          filename: result.filename,
          displayName: result.displayName,
          format: result.format,
          size: result.size,
          mimeType: result.mimeType,
          uploadedAt: profile.resume.current.uploadedAt,
        },
        parsing: profile.resume.current.aiAnalysis,
      },
      'Resume uploaded and parsed successfully'
    );
  }

  /**
   * Generate resume helper
   */
  async _generateResume(req, res, next) {
    const profile = await CandidateProfile.findOne({
      userId: req.user.id,
    }).populate('userId', 'fullName email');

    if (!profile) {
      throw new AppError('Candidate profile not found', 404);
    }

    const { template, targetJob } = req.body;

    // Generate resume using AI service
    const generatedResume = await generateResume({
      profile,
      template: template || 'modern',
      targetJob,
    });

    return ApiResponse.success(
      res,
      generatedResume,
      'Resume generated successfully'
    );
  }

  /**
   * Download resume helper
   */
  _downloadResume(profile, id, res) {
    let cvToDownload = null;

    // If id is "current", download current CV
    if (id === 'current') {
      if (!profile.resume.current || !profile.resume.current.url) {
        throw new AppError('Current resume not found', 404);
      }
      cvToDownload = profile.resume.current;
    } else {
      // Find CV in history by ID
      if (!profile.resume.history || !Array.isArray(profile.resume.history)) {
        throw new AppError('Resume history not found', 404);
      }

      const cvIndex = profile.resume.history.findIndex(
        cv => cv._id.toString() === id
      );

      if (cvIndex === -1) {
        throw new AppError('Resume not found in history', 404);
      }

      cvToDownload = profile.resume.history[cvIndex];
    }

    if (!cvToDownload || !cvToDownload.url) {
      throw new AppError('Resume URL not found', 404);
    }

    // Set download headers
    const filename =
      cvToDownload.filename || cvToDownload.displayName || 'resume.pdf';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', cvToDownload.mimeType || 'application/pdf');

    // Redirect to Cloudinary URL for download
    res.redirect(cvToDownload.url);
  }

  /**
   * Auto-fill profile from parsed data
   */
  async _autoFillProfileFromParsedData(profile, extractedData) {
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
        // Ensure proper _id for Mongoose
        profile.education.university = {
          _id: new mongoose.Types.ObjectId(),
          ...extractedData.education,
        };
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
            _id: new mongoose.Types.ObjectId(),
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

        // Ensure proper _id for Mongoose
        const experienceEntry = {
          _id: new mongoose.Types.ObjectId(),
          ...extractedData.experience,
        };

        profile.experience.internships.push(experienceEntry);
      }

      console.log('✅ Profile auto-filled from parsed resume data');
    } catch (error) {
      console.warn('⚠️ Error auto-filling profile:', error.message);
    }
  }
}

module.exports = ResumeController;
