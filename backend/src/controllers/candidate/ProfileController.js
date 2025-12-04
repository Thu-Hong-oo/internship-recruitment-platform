const mongoose = require('mongoose');
const CandidateProfile = require('../../models/CandidateProfile');
const User = require('../../models/User');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');
const APIUtils = require('../../utils/apiUtils');

class ProfileController {
  /**
   * Helper function to parse date strings into Date objects
   * Handles formats like "MM/YYYY", "DD/MM/YYYY", etc.
   */
  _parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;

    try {
      // Handle MM/YYYY or YYYY format
      if (/^\d{2}\/\d{4}$/.test(dateString)) {
        const [month, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }

      // Handle DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Handle YYYY format
      if (/^\d{4}$/.test(dateString)) {
        return new Date(parseInt(dateString), 0, 1);
      }

      // Try direct Date parsing
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      console.warn('Failed to parse date:', dateString, error.message);
      return null;
    }
  }

  /**
   * Map aiAnalysis (parsed CV data) into CandidateProfile fields
   * This should be called after CV parsing to auto-populate profile fields
   */
  async mapParsedCVToProfile(profile) {
    try {
      const aiAnalysis = profile?.resume?.current?.aiAnalysis?.extractedData;
      console.log('🔍 Mapping aiAnalysis to profile...');
      console.log('📊 aiAnalysis data available:', !!aiAnalysis);

      if (!aiAnalysis) {
        console.log('❌ No aiAnalysis data found');
        return false;
      }

      // Use the centralized auto-fill helper
      const ResumeHelpers = require('./helpers/resumeHelpers');
      await ResumeHelpers.autoFillProfileFromParsedData(profile, aiAnalysis);

      // Save the updated profile
      await profile.save();
      console.log('✅ Profile updated and saved successfully');

      return true;
    } catch (error) {
      console.error('❌ Error mapping CV to profile:', error);
      throw error;
    }
  }

  constructor() {
    // Bind all methods to preserve this context
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.getSection = this.getSection.bind(this);
    this.addToSection = this.addToSection.bind(this);
    this.updateSectionEntry = this.updateSectionEntry.bind(this);
    this.deleteSectionEntry = this.deleteSectionEntry.bind(this);
  }

  // ============================================
  // CORE PROFILE MANAGEMENT
  // ============================================

  /**
   * GET /api/candidates/me
   * Get candidate profile with flexible includes
   * Query: ?include=education,experience,skills,projects,certifications,resume,all
   * No include = basic info only
   * include=all = full profile
   */
  async getProfile(req, res, next) {
    try {
      // Check user status
      const user = await User.findById(req.user.id);
      if (!user || user.status === 'inactive' || user.deletedAt) {
        throw new AppError('Profile has been deactivated', 403);
      }

      let profile = await CandidateProfile.findOne({
        userId: req.user.id,
        $or: [{ status: { $ne: 'inactive' } }, { status: { $exists: false } }],
        deletedAt: { $exists: false },
      }).populate(['userId']);

      // Auto-create profile if not found (similar to employer logic)
      if (!profile) {
        console.log(`Creating new candidate profile for user: ${req.user.id}`);

        profile = new CandidateProfile({
          userId: req.user.id,
          personalInfo: {
            fullName: req.user.fullName || '',
            email: req.user.email || '',
            phone: '',
            address: null,
            dateOfBirth: null,
            gender: '',
            avatar: req.user.avatar || null,
          },
          progress: {
            profileCompleteness: 10, // Start with basic info
            lastUpdated: new Date(),
          },
          status: 'active',
        });

        await profile.save();
        console.log(`✅ Created candidate profile for user: ${req.user.id}`);

        // Re-populate after creation
        profile = await CandidateProfile.findById(profile._id).populate([
          'userId',
        ]);
      }

      // Handle include logic
      const includeParam = req.query.include;
      let responseData;

      if (!includeParam) {
        // No include = basic info only
        responseData = {
          _id: profile._id,
          userId: profile.userId,
          personalInfo: profile.personalInfo,
          progress: profile.progress,
          analytics: profile.analytics,
          settings: profile.settings,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        };
      } else if (includeParam === 'all') {
        // include=all = full profile
        responseData = profile.toObject();
      } else {
        // Specific includes = filter based on requested sections
        const includes = APIUtils.parseIncludes(includeParam);
        responseData = this._filterProfileData(profile, includes);
      }

      return ApiResponse.success(
        res,
        responseData,
        'Profile retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/candidates/me
   * Update candidate profile by section
   * Body: { section: "profile" | "visibility" | "preferences", data: {...} }
   */
  async updateProfile(req, res, next) {
    try {
      const { section, data } = req.body;

      // Validate section
      const validSections = ['profile', 'visibility', 'preferences'];
      if (!validSections.includes(section)) {
        throw new AppError(
          `Invalid section. Must be one of: ${validSections.join(', ')}`,
          400
        );
      }

      // Check user status
      const user = await User.findById(req.user.id);
      if (!user || user.status === 'inactive' || user.deletedAt) {
        throw new AppError('Cannot update deactivated profile', 403);
      }

      const profile = await CandidateProfile.findOne({
        userId: req.user.id,
        $or: [{ status: { $ne: 'inactive' } }, { status: { $exists: false } }],
        deletedAt: { $exists: false },
      });

      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      // Update based on section
      switch (section) {
        case 'profile':
          await this._updateProfileSection(profile, data);
          break;
        case 'visibility':
          await this._updateVisibilitySection(profile, data);
          break;
        case 'preferences':
          await this._updatePreferencesSection(profile, data);
          break;
      }

      // Recalculate profile completion
      profile.progress.profileCompletion =
        this._calculateProfileCompletion(profile);
      await profile.save();

      // Cập nhật notification nếu candidate thay đổi tên
      if (section === 'profile' && data.personalInfo?.fullName) {
        try {
          const NotificationService = require('../../services/notification/notificationService');
          await NotificationService.updateCandidateNameInNotifications(
            req.user.id.toString(),
            data.personalInfo.fullName
          );
        } catch (notifyError) {
          // Log error nhưng không fail request
          const { logger } = require('../../utils/logger');
          logger.error('Failed to update candidate name in notifications', {
            error: notifyError.message,
            candidateId: req.user.id,
          });
        }
      }

      return ApiResponse.success(
        res,
        { section, updated: data },
        `${section} updated successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PROFILE SECTIONS CRUD
  // ============================================

  /**
   * GET /api/candidates/me/:section
   * Get specific profile section
   * :section = education | experience | skills | projects | certifications
   */
  async getSection(req, res, next) {
    try {
      const { section } = req.params;
      this._validateSection(section);

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      const sectionData = this._getSectionData(profile, section);

      return ApiResponse.success(
        res,
        sectionData,
        `${section} retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/candidates/me/:section
   * Add new entry to profile section
   */
  async addToSection(req, res, next) {
    try {
      const { section } = req.params;
      this._validateSection(section);

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      const newEntry = await this._addSectionEntry(profile, section, req.body);
      await profile.save();

      return ApiResponse.success(
        res,
        newEntry,
        `${section} entry added successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/candidates/me/:section/:id
   * Update specific entry in profile section
   */
  async updateSectionEntry(req, res, next) {
    try {
      const { section, id } = req.params;
      this._validateSection(section);

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      const updatedEntry = await this._updateSectionEntry(
        profile,
        section,
        id,
        req.body
      );
      await profile.save();

      return ApiResponse.success(
        res,
        updatedEntry,
        `${section} entry updated successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/candidates/me/:section/:id
   * Delete specific entry from profile section
   */
  async deleteSectionEntry(req, res, next) {
    try {
      const { section, id } = req.params;
      this._validateSection(section);

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      await this._deleteSectionEntry(profile, section, id);
      await profile.save();

      return ApiResponse.success(
        res,
        null,
        `${section} entry deleted successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Filter profile data based on includes
   */
  _filterProfileData(profile, includes) {
    const data = {
      _id: profile._id,
      userId: profile.userId,
      personalInfo: profile.personalInfo,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    if (includes.includes('education')) {
      data.education = profile.education;
    }

    if (includes.includes('experience')) {
      data.experience = profile.experience;
    }

    if (includes.includes('skills')) {
      data.skills = profile.skills;
    }

    if (includes.includes('projects')) {
      data.projects = profile.experience?.projects || [];
    }

    if (includes.includes('certifications')) {
      data.certifications = profile.education?.certifications || [];
    }

    if (includes.includes('resume')) {
      data.resume = profile.resume;
    }

    // Always include progress and analytics for dashboard
    data.progress = profile.progress;
    data.analytics = profile.analytics;

    return data;
  }

  /**
   * Validate section parameter
   */
  _validateSection(section) {
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
   * Get section data from profile
   */
  _getSectionData(profile, section) {
    switch (section) {
      case 'education':
        return profile.education;
      case 'experience':
        return profile.experience;
      case 'skills':
        return profile.skills;
      case 'projects':
        return profile.experience?.projects || [];
      case 'certifications':
        return profile.education?.certifications || [];
      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Add entry to section
   */
  async _addSectionEntry(profile, section, data) {
    const newId = new mongoose.Types.ObjectId();
    const newEntry = { _id: newId, ...data };

    switch (section) {
      case 'education':
        if (data.type === 'university') {
          // Check if university education already exists
          if (
            profile.education.university &&
            profile.education.university.institution
          ) {
            throw new AppError(
              'University education already exists. Use update instead.',
              400
            );
          }
          profile.education.university = newEntry;
          return profile.education.university;
        } else {
          // Add to certifications
          if (!profile.education.certifications)
            profile.education.certifications = [];
          profile.education.certifications.push(newEntry);
          return newEntry;
        }

      case 'experience':
        if (data.type === 'internship') {
          if (!profile.experience.internships)
            profile.experience.internships = [];
          profile.experience.internships.push(newEntry);
        } else {
          if (!profile.experience.projects) profile.experience.projects = [];
          profile.experience.projects.push(newEntry);
        }
        return newEntry;

      case 'skills':
        const skillType = data.type || 'technical';
        if (!profile.skills[skillType]) profile.skills[skillType] = [];
        profile.skills[skillType].push(newEntry);
        return newEntry;

      case 'projects':
        if (!profile.experience.projects) profile.experience.projects = [];
        profile.experience.projects.push(newEntry);
        return newEntry;

      case 'certifications':
        if (!profile.education.certifications)
          profile.education.certifications = [];
        profile.education.certifications.push(newEntry);
        return newEntry;

      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Update entry in section
   */
  async _updateSectionEntry(profile, section, id, data) {
    switch (section) {
      case 'education':
        // Check if it's university education
        if (
          profile.education.university &&
          profile.education.university._id &&
          profile.education.university._id.toString() === id
        ) {
          profile.education.university = {
            ...profile.education.university.toObject(),
            ...data,
          };
          return profile.education.university;
        } else {
          // Find in certifications
          const certIndex = profile.education.certifications?.findIndex(
            cert => cert._id.toString() === id
          );
          if (certIndex === -1)
            throw new AppError('Education entry not found', 404);

          profile.education.certifications[certIndex] = {
            ...profile.education.certifications[certIndex].toObject(),
            ...data,
          };
          return profile.education.certifications[certIndex];
        }

      case 'experience':
        // Check internships
        let internIndex = profile.experience.internships?.findIndex(
          item => item._id.toString() === id
        );
        if (internIndex !== -1) {
          profile.experience.internships[internIndex] = {
            ...profile.experience.internships[internIndex].toObject(),
            ...data,
          };
          return profile.experience.internships[internIndex];
        }

        // Check projects
        let projectIndex = profile.experience.projects?.findIndex(
          item => item._id.toString() === id
        );
        if (projectIndex !== -1) {
          profile.experience.projects[projectIndex] = {
            ...profile.experience.projects[projectIndex].toObject(),
            ...data,
          };
          return profile.experience.projects[projectIndex];
        }

        throw new AppError('Experience entry not found', 404);

      case 'skills':
        // Check all skill types
        for (const skillType of ['technical', 'soft', 'languages']) {
          const skillIndex = profile.skills[skillType]?.findIndex(
            skill => skill._id.toString() === id
          );
          if (skillIndex !== -1) {
            profile.skills[skillType][skillIndex] = {
              ...profile.skills[skillType][skillIndex].toObject(),
              ...data,
            };
            return profile.skills[skillType][skillIndex];
          }
        }
        throw new AppError('Skill not found', 404);

      case 'projects':
        projectIndex = profile.experience.projects?.findIndex(
          project => project._id.toString() === id
        );
        if (projectIndex === -1) throw new AppError('Project not found', 404);

        profile.experience.projects[projectIndex] = {
          ...profile.experience.projects[projectIndex].toObject(),
          ...data,
        };
        return profile.experience.projects[projectIndex];

      case 'certifications':
        const certIndex = profile.education.certifications?.findIndex(
          cert => cert._id.toString() === id
        );
        if (certIndex === -1)
          throw new AppError('Certification not found', 404);

        profile.education.certifications[certIndex] = {
          ...profile.education.certifications[certIndex].toObject(),
          ...data,
        };
        return profile.education.certifications[certIndex];

      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Delete entry from section
   */
  async _deleteSectionEntry(profile, section, id) {
    switch (section) {
      case 'education':
        // Check if it's university education
        if (
          profile.education.university &&
          profile.education.university._id &&
          profile.education.university._id.toString() === id
        ) {
          profile.education.university = {};
          return;
        } else {
          // Find in certifications
          const certIndex = profile.education.certifications?.findIndex(
            cert => cert._id.toString() === id
          );
          if (certIndex === -1)
            throw new AppError('Education entry not found', 404);

          profile.education.certifications.splice(certIndex, 1);
          return;
        }

      case 'experience':
        // Check internships
        let internIndex = profile.experience.internships?.findIndex(
          item => item._id.toString() === id
        );
        if (internIndex !== -1) {
          profile.experience.internships.splice(internIndex, 1);
          return;
        }

        // Check projects
        let projectIndex = profile.experience.projects?.findIndex(
          item => item._id.toString() === id
        );
        if (projectIndex !== -1) {
          profile.experience.projects.splice(projectIndex, 1);
          return;
        }

        throw new AppError('Experience entry not found', 404);

      case 'skills':
        // Check all skill types
        for (const skillType of ['technical', 'soft', 'languages']) {
          const skillIndex = profile.skills[skillType]?.findIndex(
            skill => skill._id.toString() === id
          );
          if (skillIndex !== -1) {
            profile.skills[skillType].splice(skillIndex, 1);
            return;
          }
        }
        throw new AppError('Skill not found', 404);

      case 'projects':
        projectIndex = profile.experience.projects?.findIndex(
          project => project._id.toString() === id
        );
        if (projectIndex === -1) throw new AppError('Project not found', 404);

        profile.experience.projects.splice(projectIndex, 1);
        return;

      case 'certifications':
        const certIndex = profile.education.certifications?.findIndex(
          cert => cert._id.toString() === id
        );
        if (certIndex === -1)
          throw new AppError('Certification not found', 404);

        profile.education.certifications.splice(certIndex, 1);
        return;

      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Update profile section
   */
  async _updateProfileSection(profile, data) {
    if (data.personalInfo) {
      profile.personalInfo = { ...profile.personalInfo, ...data.personalInfo };
    }
    if (data.settings) {
      profile.settings = { ...profile.settings, ...data.settings };
    }
  }

  /**
   * Update visibility section
   */
  async _updateVisibilitySection(profile, data) {
    if (data.visibility) {
      profile.personalInfo.visibility = {
        ...profile.personalInfo.visibility,
        ...data.visibility,
      };
    }
  }

  /**
   * Update preferences section
   */
  async _updatePreferencesSection(profile, data) {
    if (data.preferences) {
      profile.settings.preferences = {
        ...profile.settings.preferences,
        ...data.preferences,
      };
    }
  }

  /**
   * Calculate profile completion percentage
   */
  _calculateProfileCompletion(profile) {
    let completed = 0;
    const totalSections = 6;

    // Basic info
    if (profile.personalInfo.fullName && profile.personalInfo.email) {
      completed++;
    }

    // Education
    if (profile.education.university?.institution) {
      completed++;
    }

    // Experience
    if (
      profile.experience.internships?.length > 0 ||
      profile.experience.projects?.length > 0
    ) {
      completed++;
    }

    // Skills
    if (
      profile.skills.technical?.length > 0 ||
      profile.skills.soft?.length > 0
    ) {
      completed++;
    }

    // Resume
    if (profile.resume.current?.url) {
      completed++;
    }

    // Additional info (certifications, languages, etc.)
    if (
      profile.education.certifications?.length > 0 ||
      profile.skills.languages?.length > 0
    ) {
      completed++;
    }

    return Math.round((completed / totalSections) * 100);
  }
}

module.exports = ProfileController;
