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

      // Personal Info - FIX: Update even if exists (CV data is more recent)
      if (aiAnalysis.personalInfo) {
        const { fullName, email, phone, address, dateOfBirth } =
          aiAnalysis.personalInfo;
        
        // Update fullName if provided (CV is source of truth)
        if (fullName && fullName.trim()) {
          profile.personalInfo.fullName = fullName.trim();
        }
        
        // Update email if provided and valid
        if (email && email.trim() && email.includes('@')) {
          profile.personalInfo.email = email.trim().toLowerCase();
        }
        
        // Update phone if provided
        if (phone && phone.trim()) {
          profile.personalInfo.phone = phone.trim();
        }
        
        // Update address if provided
        if (address) {
          if (typeof address === 'string' && address.trim() !== '') {
            // Try to parse structured address
            const addressParts = address.split(',').map(s => s.trim());
            if (addressParts.length > 1) {
              profile.personalInfo.address = {
                street: addressParts[0] || '',
                ward: addressParts[1] || '',
                district: addressParts[2] || '',
                city: addressParts[addressParts.length - 1] || '',
                country: 'Vietnam',
              };
            } else {
              // Simple address string
              profile.personalInfo.address = {
                street: address.trim(),
                city: '',
                country: 'Vietnam',
              };
            }
          } else if (typeof address === 'object' && address !== null) {
            profile.personalInfo.address = address;
          }
        }
        
        // Update dateOfBirth if provided
        if (dateOfBirth) {
          const parsedDate = this._parseDate(dateOfBirth);
          if (parsedDate) {
            profile.personalInfo.dateOfBirth = parsedDate;
          }
        }
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
          const skillName = typeof skill === 'string' ? skill : skill.name;
          const skillType = skill.type || 'technical';
          if (!skillName) continue;

          // Ensure the skill type array exists
          if (!profile.skills) {
            profile.skills = { technical: [], soft: [], languages: [] };
          }
          if (!profile.skills[skillType]) {
            profile.skills[skillType] = [];
          }
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
      // FIX: Also check the root-level skills array from aiAnalysis
      const rootSkills = profile?.resume?.current?.aiAnalysis?.skills;
      if (Array.isArray(rootSkills) && rootSkills.length > 0) {
        if (!profile.skills) {
          profile.skills = { technical: [], soft: [], languages: [] };
        }
        if (!profile.skills.technical) {
          profile.skills.technical = [];
        }
        const existingSkills = profile.skills.technical.map(s =>
          s.name?.toLowerCase()
        );
        for (const skillName of rootSkills) {
          if (skillName && !existingSkills.includes(skillName.toLowerCase())) {
            profile.skills.technical.push({
              _id: new mongoose.Types.ObjectId(),
              name: skillName,
              level: 'intermediate',
              verified: false,
            });
            existingSkills.push(skillName.toLowerCase()); // Add to check list to avoid duplicates in the same run
          }
        }
      }

      // Experience (array) - FIX: Better duplicate check and preserve description
      if (
        Array.isArray(aiAnalysis.experience) &&
        aiAnalysis.experience.length > 0
      ) {
        for (const exp of aiAnalysis.experience) {
          const expType = exp.type || 'internship';
          // FIX: Treat 'job' and other types as 'internship' for now to ensure they are saved.
          // The CandidateProfile model currently only supports 'internships' and 'projects'.
          if (expType === 'internship' || expType === 'job') {
            if (!profile.experience.internships)
              profile.experience.internships = [];
            
            // Normalize company and position for comparison
            const expCompany = (exp.company || '').trim().toLowerCase();
            const expPosition = (exp.position || '').trim().toLowerCase();
            
            // Check if experience already exists
            const existingIndex = profile.experience.internships.findIndex(e => {
              const eCompany = (e.company || '').trim().toLowerCase();
              const ePosition = (e.position || '').trim().toLowerCase();
              return eCompany === expCompany && ePosition === expPosition;
            });
            
            if (existingIndex >= 0) {
              // Update existing experience with new data (merge description)
              const existing = profile.experience.internships[existingIndex];
              if (exp.description && exp.description.trim()) {
                // Merge descriptions if both exist
                if (existing.description && existing.description.trim()) {
                  existing.description = existing.description + '\n\n' + exp.description.trim();
                } else {
                  existing.description = exp.description.trim();
                }
              }
              // Update dates if provided
              if (exp.startDate) {
                const parsedStart = this._parseDate(exp.startDate);
                if (parsedStart) existing.startDate = parsedStart;
              }
              if (exp.endDate) {
                const parsedEnd = this._parseDate(exp.endDate);
                if (parsedEnd) existing.endDate = parsedEnd;
              }
            } else {
              // Add new experience
              profile.experience.internships.push({
                _id: new mongoose.Types.ObjectId(),
                company: exp.company || '',
                position: exp.position || '',
                startDate: this._parseDate(exp.startDate),
                endDate: this._parseDate(exp.endDate),
                description: (exp.description || '').trim(),
                location: exp.location || '',
                skills: exp.skills || [],
                projects: exp.projects || [],
              });
            }
          } else if (expType === 'project') {
            if (!profile.experience.projects) profile.experience.projects = [];
            const exists = profile.experience.projects?.some(
              p => p.title === exp.position && p.name === exp.company
            );
            if (!exists) {
              profile.experience.projects.push({
                _id: new mongoose.Types.ObjectId(),
                title: exp.position || '',
                name: exp.company || '',
                description: (exp.description || '').trim(),
                technologies: exp.technologies || [],
                url: exp.url || '',
                startDate: this._parseDate(exp.startDate),
                endDate: this._parseDate(exp.endDate),
              });
            }
          }
        }
      }
      // Certifications - FIX: Better duplicate detection
      if (
        Array.isArray(aiAnalysis.certificates) &&
        aiAnalysis.certificates.length > 0
      ) {
        if (!profile.education.certifications)
          profile.education.certifications = [];
        
        // Normalize certification name for comparison
        const normalizeCertName = (name) => {
          if (!name) return '';
          return name.toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, ''); // Remove special chars
        };
        
        for (const cert of aiAnalysis.certificates) {
          const certName = (cert.name || '').trim();
          if (!certName) continue;
          
          const normalizedName = normalizeCertName(certName);
          
          // Check if certification already exists (by normalized name, case-insensitive)
          const exists = profile.education.certifications.some(c => {
            const existingName = normalizeCertName(c.name);
            // Match if names are similar (exact match or one contains the other)
            return existingName === normalizedName || 
                   existingName.includes(normalizedName) || 
                   normalizedName.includes(existingName);
          });
          
          if (!exists) {
            profile.education.certifications.push({
              _id: new mongoose.Types.ObjectId(),
              type: 'certification',
              name: certName,
              issuer: (cert.issuer || '').trim() || '',
              year: cert.year || null,
              achievements: [],
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

      // Fix existing profile with invalid gender (empty string)
      if (profile && profile.personalInfo && profile.personalInfo.gender === '') {
        console.log(`🔧 Fixing invalid gender field for user: ${req.user.id}`);
        profile.personalInfo.gender = undefined;
        try {
          await profile.save();
          console.log(`✅ Fixed gender field for user: ${req.user.id}`);
        } catch (error) {
          console.error(`❌ Failed to fix gender field:`, error.message);
          // If save fails, delete the invalid gender field
          profile.personalInfo.gender = undefined;
          profile.markModified('personalInfo.gender');
          await profile.save({ validateBeforeSave: false });
        }
      }

      // Auto-create profile if not found (similar to employer logic)
      if (!profile) {
        console.log(`Creating new candidate profile for user: ${req.user.id}`);

        try {
          profile = new CandidateProfile({
            userId: req.user.id,
            personalInfo: {
              fullName: req.user.fullName || '',
              email: req.user.email || '',
              phone: '',
              address: null,
              dateOfBirth: null,
              // Don't set gender if not provided - let it be undefined
              // gender must be one of: 'male', 'female', 'other', 'prefer_not_to_say'
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
        } catch (error) {
          console.error(`❌ Failed to create candidate profile:`, error.message);
          // If validation fails, try again without gender field
          if (error.message.includes('gender')) {
            profile = new CandidateProfile({
              userId: req.user.id,
              personalInfo: {
                fullName: req.user.fullName || '',
                email: req.user.email || '',
                phone: '',
                address: null,
                dateOfBirth: null,
                avatar: req.user.avatar || null,
              },
              progress: {
                profileCompleteness: 10,
                lastUpdated: new Date(),
              },
              status: 'active',
            });
            await profile.save();
            console.log(`✅ Created candidate profile (retry) for user: ${req.user.id}`);
          } else {
            throw error;
          }
        }

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
