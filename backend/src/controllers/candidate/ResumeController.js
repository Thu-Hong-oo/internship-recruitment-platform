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
   * Delete specific resume version
   */
  async deleteResume(req, res, next) {
    try {
      const { id } = req.params;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      // Delete from cloudinary if exists
      if (profile.resume.current.publicId) {
        await uploadService.deleteFile(profile.resume.current.publicId);
      }

      // Clear current resume
      profile.resume.current = {};
      await profile.save();

      return ApiResponse.success(res, null, 'Resume deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper method to fetch file from URL using native Node.js modules
   */
  _fetchFile(url) {
    return new Promise((resolve, reject) => {
      // Validate URL
      if (!url || typeof url !== 'string') {
        reject(new Error('Invalid URL provided'));
        return;
      }

      const client = url.startsWith('https:') ? https : http;

      client
        .get(url, response => {
          if (response.statusCode !== 200) {
            reject(
              new Error(
                `HTTP ${response.statusCode}: ${response.statusMessage}`
              )
            );
            return;
          }

          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        })
        .on('error', reject);
    });
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

      console.log('📄 CV URL:', url);
      console.log('🔑 Public ID:', publicId);

      try {
        // Get accessible URL for viewing (signed URL if needed)
        let accessibleUrl = url;

        // TEMPORARY: Skip signed URLs for testing, use original URL directly
        console.log(
          '⚡ Using original URL directly (bypass signed URL for testing)'
        );
        accessibleUrl = url;

        // Fix HTTPS for Cloudinary URLs
        if (accessibleUrl.startsWith('http://res.cloudinary.com')) {
          accessibleUrl = accessibleUrl.replace('http://', 'https://');
          console.log('🔒 Fixed to HTTPS:', accessibleUrl);
        }

        // Stream từ Cloudinary về với header inline để trình duyệt hiển thị
        let response = await fetch(accessibleUrl);
        console.log(
          '🌐 Fetch response status:',
          response.status,
          response.statusText
        );

        // If signed URL fails with 401, fallback to original URL (like candidateProfileController)
        if (!response.ok && response.status === 401 && accessibleUrl !== url) {
          console.log('🔄 Signed URL failed, retrying with original URL...');
          response = await fetch(url);
          console.log(
            '🌐 Original URL response status:',
            response.status,
            response.statusText
          );
          accessibleUrl = url; // Update for logging
        }

        if (!response.ok) {
          throw new AppError(
            `Không thể tải CV từ Cloudinary: ${response.status} ${response.statusText}`,
            502
          );
        }

        // Get filename và format từ current resume
        const filename = profile.resume.current.filename || 'resume.pdf';
        const format = profile.resume.current.format || 'pdf';

        console.log('📋 File info:', { filename, format });

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

        const arrayBuffer = await response.arrayBuffer();
        console.log(
          '✅ Successfully fetched CV, size:',
          arrayBuffer.byteLength
        );
        res.send(Buffer.from(arrayBuffer));
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
        ...profile.resume.current,
        uploadedAt: profile.resume.current.updatedAt,
      });
    }

    // Set new resume as current
    profile.resume.current = {
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
    if (!profile.resume.current.url) {
      throw new AppError('Resume not found', 404);
    }

    res.redirect(profile.resume.current.url);
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
