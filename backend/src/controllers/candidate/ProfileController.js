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

      console.log('🎯 Processing sections:', {
        personalInfo: !!aiAnalysis.personalInfo,
        education: !!aiAnalysis.education,
        skills: Array.isArray(aiAnalysis.skills) ? aiAnalysis.skills.length : 0,
        experience: Array.isArray(aiAnalysis.experience)
          ? aiAnalysis.experience.length
          : 0,
        certificates: Array.isArray(aiAnalysis.certificates)
          ? aiAnalysis.certificates.length
          : 0,
        awards: Array.isArray(aiAnalysis.awards) ? aiAnalysis.awards.length : 0,
      });

      // Personal Info
      if (aiAnalysis.personalInfo) {
        const { fullName, email, phone, address, dateOfBirth } =
          aiAnalysis.personalInfo;
        if (fullName && !profile.personalInfo.fullName)
          profile.personalInfo.fullName = fullName;
        if (email && !profile.personalInfo.email)
          profile.personalInfo.email = email;
        if (phone && !profile.personalInfo.phone)
          profile.personalInfo.phone = phone;
        if (address && !profile.personalInfo.address) {
          // Validate address is not empty string before setting
          if (typeof address === 'string' && address.trim() !== '') {
            profile.personalInfo.address = address;
          } else if (typeof address === 'object' && address !== null) {
            profile.personalInfo.address = address;
          }
          // Skip if address is empty string to prevent MongoDB error
        }
        if (dateOfBirth && !profile.personalInfo.dateOfBirth)
          profile.personalInfo.dateOfBirth = dateOfBirth;
      }

      // Education
      if (aiAnalysis.education && !profile.education.university?.institution) {
        profile.education.university = {
          _id: new mongoose.Types.ObjectId(),
          type: aiAnalysis.education.type || 'university',
          institution:
            aiAnalysis.education.institution || aiAnalysis.education.name || '',
          name:
            aiAnalysis.education.name || aiAnalysis.education.institution || '',
          major: aiAnalysis.education.major || aiAnalysis.education.field || '',
          degree: aiAnalysis.education.degree || '',
          field: aiAnalysis.education.field || '',
          startDate: this._parseDate(aiAnalysis.education.startDate),
          endDate: this._parseDate(aiAnalysis.education.endDate),
          graduationYear: aiAnalysis.education.graduationYear || null,
          gpa: aiAnalysis.education.gpa || null,
          achievements: aiAnalysis.education.achievements || [],
          courses: aiAnalysis.education.courses || [],
        };
      }

      // Skills (support type: technical, soft, languages)
      if (Array.isArray(aiAnalysis.skills) && aiAnalysis.skills.length > 0) {
        for (const skill of aiAnalysis.skills) {
          let skillName = typeof skill === 'string' ? skill : skill.name;
          let skillType = skill.type || 'technical';
          if (!skillName) continue;
          if (!profile.skills[skillType]) profile.skills[skillType] = [];
          const exists = profile.skills[skillType].some(
            s => s.name?.toLowerCase() === skillName.toLowerCase()
          );
          if (!exists) {
            profile.skills[skillType].push({
              _id: new mongoose.Types.ObjectId(),
              name: skillName,
              level: skill.level || 'intermediate',
              verified: false,
            });
          }
        }
      }

      // Experience (array)
      if (
        Array.isArray(aiAnalysis.experience) &&
        aiAnalysis.experience.length > 0
      ) {
        for (const exp of aiAnalysis.experience) {
          let expType = exp.type || 'internship';
          if (expType === 'internship') {
            if (!profile.experience.internships)
              profile.experience.internships = [];
            const exists = profile.experience.internships.some(
              e => e.company === exp.company && e.position === exp.position
            );
            if (!exists) {
              profile.experience.internships.push({
                _id: new mongoose.Types.ObjectId(),
                company: exp.company || '',
                position: exp.position || '',
                startDate: this._parseDate(exp.startDate),
                endDate: this._parseDate(exp.endDate),
                description: exp.description || '',
                skills: exp.skills || [],
                projects: exp.projects || [],
              });
            }
          } else if (expType === 'project') {
            if (!profile.experience.projects) profile.experience.projects = [];
            const exists = profile.experience.projects.some(
              p => p.title === exp.position && p.name === exp.company
            );
            if (!exists) {
              profile.experience.projects.push({
                _id: new mongoose.Types.ObjectId(),
                title: exp.position || '',
                name: exp.company || '',
                description: exp.description || '',
                technologies: exp.technologies || [],
                url: exp.url || '',
                startDate: this._parseDate(exp.startDate),
                endDate: this._parseDate(exp.endDate),
              });
            }
          }
        }
      }
      // Certifications
      if (
        Array.isArray(aiAnalysis.certificates) &&
        aiAnalysis.certificates.length > 0
      ) {
        if (!profile.education.certifications)
          profile.education.certifications = [];
        for (const cert of aiAnalysis.certificates) {
          const exists = profile.education.certifications.some(
            c => c.name === cert.name && c.year === cert.year
          );
          if (!exists) {
            profile.education.certifications.push({
              _id: new mongoose.Types.ObjectId(),
              name: cert.name || '',
              issuer: cert.issuer || '',
              year: cert.year || null,
            });
          }
        }
      }

      // Awards
      if (Array.isArray(aiAnalysis.awards) && aiAnalysis.awards.length > 0) {
        if (!profile.education.awards) profile.education.awards = [];
        for (const award of aiAnalysis.awards) {
          const exists = profile.education.awards.some(
            a => a.name === award.name && a.year === award.year
          );
          if (!exists) {
            profile.education.awards.push({
              _id: new mongoose.Types.ObjectId(),
              name: award.name || '',
              year: award.year || null,
              description: award.description || '',
            });
          }
        }
      }

      // Projects (array)
      if (
        Array.isArray(aiAnalysis.projects) &&
        aiAnalysis.projects.length > 0
      ) {
        if (!profile.experience.projects) profile.experience.projects = [];
        for (const proj of aiAnalysis.projects) {
          const exists = profile.experience.projects.some(
            p => p.name === proj.name && p.description === proj.description
          );
          if (!exists) {
            profile.experience.projects.push({
              _id: new mongoose.Types.ObjectId(),
              name: proj.name || '',
              description: proj.description || '',
              technologies: proj.techStack || [],
              url: proj.url || '',
              startDate: this._parseDate(proj.startDate),
              endDate: this._parseDate(proj.endDate),
            });
          }
        }
      }

      // Optionally: certifications, languages, etc. (extend as needed)

      // Save profile after mapping
      console.log('💾 Saving profile with mapped data...');
      await profile.save();
      console.log('✅ Profile successfully saved with CV data');
      return true;
    } catch (error) {
      console.error('❌ Error mapping aiAnalysis to profile:', error.message);
      console.error('Stack trace:', error.stack);
      return false;
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
