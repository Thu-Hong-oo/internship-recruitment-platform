// services/unifiedProfileService.js
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');
const { logger } = require('../utils/logger');
const { sanitizeInput } = require('../utils/verificationValidation');

class UnifiedProfileService {
  // ============= SHARED UTILITIES =============
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }

  static validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validatePhone(phone) {
    return /^[0-9+\-\s()]{8,15}$/.test(phone);
  }

  static handleError(error, res, context = 'Profile update') {
    logger.error(`${context} failed:`, {
      error: error.message,
      stack: error.stack,
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        err => err.message
      );
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: validationErrors,
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        success: false,
        error: `${field} đã tồn tại trong hệ thống`,
      });
    }

    return res.status(500).json({
      success: false,
      error: `${context} thất bại`,
    });
  }

  static successResponse(res, message, data) {
    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  // ============= PROFILE OPERATIONS =============

  /**
   * Universal Profile Update
   * Handles both User fields and role-specific profile fields
   */
  static async updateProfile(userId, updates, options = {}) {
    const {
      role,
      restrictFields = [],
      allowedSections = [],
      updateUser = true,
    } = options;

    try {
      // Validate restricted fields
      if (restrictFields.length > 0) {
        const invalidFields = Object.keys(updates).filter(
          field => !restrictFields.includes(field)
        );
        if (invalidFields.length > 0) {
          throw new Error(
            `Các trường không được phép: ${invalidFields.join(', ')}`
          );
        }
      }

      // Validate allowed sections
      if (allowedSections.length > 0) {
        const invalidSections = Object.keys(updates).filter(
          section => !allowedSections.includes(section)
        );
        if (invalidSections.length > 0) {
          throw new Error(
            `Các section không được phép: ${invalidSections.join(', ')}`
          );
        }
      }

      let userUpdates = {};
      let profileUpdates = {};
      let updatedUser = null;
      let updatedProfile = null;

      // ===== USER MODEL UPDATES =====
      const userFields = ['fullName', 'email', 'phone'];
      userFields.forEach(field => {
        if (updates[field] !== undefined) {
          userUpdates[field] = this.sanitizeInput(updates[field]);
        }
      });

      if (updateUser && Object.keys(userUpdates).length > 0) {
        // Validate user fields
        if (userUpdates.email && !this.validateEmail(userUpdates.email)) {
          throw new Error('Email không hợp lệ');
        }
        if (userUpdates.phone && !this.validatePhone(userUpdates.phone)) {
          throw new Error('Số điện thoại không hợp lệ');
        }

        updatedUser = await User.findByIdAndUpdate(userId, userUpdates, {
          new: true,
          runValidators: true,
        }).select('-password');
      }

      // ===== PROFILE MODEL UPDATES =====
      if (role === 'candidate') {
        profileUpdates = this.extractCandidateFields(updates);
        if (Object.keys(profileUpdates).length > 0) {
          updatedProfile = await this.updateCandidateProfile(
            userId,
            profileUpdates
          );
        }
      } else if (role === 'employer') {
        profileUpdates = this.extractEmployerFields(updates);
        if (Object.keys(profileUpdates).length > 0) {
          updatedProfile = await this.updateEmployerProfile(
            userId,
            profileUpdates
          );
        }
      }

      // Log success
      logger.info(`Profile updated successfully`, {
        userId,
        role,
        userFields: Object.keys(userUpdates),
        profileFields: Object.keys(profileUpdates),
      });

      return {
        user: updatedUser,
        profile: updatedProfile,
        updatedFields: {
          user: Object.keys(userUpdates),
          profile: Object.keys(profileUpdates),
        },
      };
    } catch (error) {
      logger.error('Unified profile update failed:', {
        error: error.message,
        userId,
        role,
        updates: Object.keys(updates),
      });
      throw error;
    }
  }

  // ============= CANDIDATE SPECIFIC =============
  static extractCandidateFields(updates) {
    const candidateFields = [
      'education',
      'skills',
      'preferences',
      'resume',
      'experience',
      'address',
      'dob',
      'gender',
      'avatar',
      'summary',
      'socialLinks',
    ];

    const extracted = {};
    candidateFields.forEach(field => {
      if (updates[field] !== undefined) {
        extracted[field] = updates[field];
      }
    });

    // Handle dot-notation fields từ userController
    Object.keys(updates).forEach(key => {
      if (
        key.startsWith('education.') ||
        key.startsWith('skills.') ||
        key.startsWith('preferences.') ||
        key.startsWith('resume.')
      ) {
        extracted[key] = updates[key];
      }
    });

    return extracted;
  }

  static async updateCandidateProfile(userId, updates) {
    let profile = await CandidateProfile.findOne({ userId });
    if (!profile) {
      profile = await CandidateProfile.create({ userId });
    }

    // Handle dot-notation updates (from userController logic)
    const dotNotationUpdates = {};
    const directUpdates = {};

    Object.keys(updates).forEach(key => {
      if (key.includes('.')) {
        dotNotationUpdates[key] = updates[key];
      } else {
        directUpdates[key] = updates[key];
      }
    });

    // Apply direct updates
    if (Object.keys(directUpdates).length > 0) {
      Object.assign(profile, directUpdates);
    }

    // Apply dot-notation updates
    if (Object.keys(dotNotationUpdates).length > 0) {
      // Handle university legacy compatibility (from userController)
      const hasUniversityNested = Object.keys(dotNotationUpdates).some(k =>
        k.startsWith('education.university.')
      );

      if (
        hasUniversityNested &&
        profile.education &&
        typeof profile.education.university === 'string'
      ) {
        const currentName = profile.education.university;
        profile.education.university = { name: currentName };
      }

      // Consolidate university fields
      if (hasUniversityNested) {
        const consolidated = { ...(profile.education?.university || {}) };
        Object.keys(dotNotationUpdates).forEach(key => {
          if (key.startsWith('education.university.')) {
            const subKey = key.substring('education.university.'.length);
            consolidated[subKey] = dotNotationUpdates[key];
            delete dotNotationUpdates[key];
          }
        });
        dotNotationUpdates['education.university'] = consolidated;
      }

      // Apply remaining dot-notation updates
      for (const [key, value] of Object.entries(dotNotationUpdates)) {
        profile.set(key, value);
      }
    }

    await profile.save();

    // Update profile completion if method exists
    if (profile.updateProfileCompletion) {
      await profile.updateProfileCompletion();
    }

    return profile;
  }

  // ============= EMPLOYER SPECIFIC =============
  static extractEmployerFields(updates) {
    const employerFields = [
      'company',
      'position',
      'contact',
      'businessInfo',
      'legalRepresentative',
      'documents',
    ];

    const extracted = {};
    employerFields.forEach(field => {
      if (updates[field] !== undefined) {
        extracted[field] = updates[field];
      }
    });

    // Handle dot-notation fields từ userController
    Object.keys(updates).forEach(key => {
      if (
        key.startsWith('company.') ||
        key.startsWith('position.') ||
        key.startsWith('contact.') ||
        key.startsWith('businessInfo.') ||
        key.startsWith('legalRepresentative.')
      ) {
        extracted[key] = updates[key];
      }
    });

    return extracted;
  }

  static async updateEmployerProfile(userId, updates) {
    let profile = await EmployerProfile.findOne({ owner: userId });
    if (!profile) {
      profile = await this.ensureEmployerProfile(userId);
    }

    // --- BỔ SUNG KIỂM TRA TRÙNG TAXID KHI UPDATE ---
    if (updates.businessInfo && updates.businessInfo.taxId) {
      const exists = await EmployerProfile.findOne({
        'businessInfo.taxId': updates.businessInfo.taxId,
        owner: { $ne: userId },
      });
      if (exists) {
        throw new Error('Mã số thuế đã tồn tại ở một hồ sơ khác');
      }
    }

    // Initialize nested objects if needed
    if (!profile.company) profile.company = {};
    if (!profile.position) profile.position = {};
    if (!profile.contact) profile.contact = {};
    if (!profile.businessInfo) profile.businessInfo = {};
    if (!profile.legalRepresentative) profile.legalRepresentative = {};

    // Handle dot-notation updates (from userController logic)
    const dotNotationUpdates = {};
    const directUpdates = {};

    Object.keys(updates).forEach(key => {
      if (key.includes('.')) {
        dotNotationUpdates[key] = updates[key];
      } else {
        directUpdates[key] = updates[key];
      }
    });

    // Apply direct updates with sanitization
    Object.keys(directUpdates).forEach(key => {
      if (
        typeof directUpdates[key] === 'object' &&
        directUpdates[key] !== null
      ) {
        // For nested objects, sanitize string values
        const sanitizedObject = {};
        Object.keys(directUpdates[key]).forEach(subKey => {
          const value = directUpdates[key][subKey];
          sanitizedObject[subKey] =
            typeof value === 'string' ? this.sanitizeInput(value) : value;
        });
        profile[key] = { ...profile[key], ...sanitizedObject };
      } else {
        profile[key] = directUpdates[key];
      }
    });

    // Apply dot-notation updates
    Object.keys(dotNotationUpdates).forEach(key => {
      const value =
        typeof dotNotationUpdates[key] === 'string'
          ? this.sanitizeInput(dotNotationUpdates[key])
          : dotNotationUpdates[key];
      profile.set(key, value);
    });

    await profile.save({ validateBeforeSave: false });

    // Update User model if contact info changed
    if (updates.contact?.name || updates.contact?.phone) {
      const userUpdates = {};
      if (updates.contact.name) userUpdates.fullName = updates.contact.name;
      if (updates.contact.phone) userUpdates.phone = updates.contact.phone;
      await User.findByIdAndUpdate(userId, userUpdates);
    }

    return profile;
  }

  static async ensureEmployerProfile(userId) {
    let profile = await EmployerProfile.findOne({ owner: userId });
    if (!profile) {
      profile = await EmployerProfile.create({
        owner: userId,
        company: {
          name: 'Chưa cập nhật',
          industry: 'unknown',
          size: 'small',
          email: 'temp@example.com',
        },
        position: {
          title: 'Chưa cập nhật',
          level: 'junior',
          department: 'Chưa cập nhật',
        },
        contact: {
          name: 'Chưa cập nhật',
          phone: 'Chưa cập nhật',
          email: 'temp@example.com',
        },
        legalRepresentative: {
          fullName: 'Chưa cập nhật',
          position: 'Chưa cập nhật',
          phone: 'Chưa cập nhật',
          email: 'temp@example.com',
        },
        businessInfo: {
          registrationNumber: 'temp',
          taxId: `temp_${userId}_${Date.now()}`,
          issueDate: new Date(),
          issuePlace: 'Chưa cập nhật',
        },
      });
      await User.findByIdAndUpdate(userId, { employerProfile: profile._id });
    }
    return profile;
  }

  // ============= GET PROFILE =============
  static async getCompleteProfile(userId, role) {
    console.log('=== UnifiedProfileService.getCompleteProfile ===');
    console.log('Input userId:', userId);
    console.log('Input role:', role);

    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    console.log('DB User found:', user._id.toString());
    console.log('DB User role:', user.role);
    console.log('DB User email:', user.email);

    let profile = {};
    if (role === 'candidate') {
      console.log('Querying CandidateProfile with userId:', userId);
      const candidateProfile = await CandidateProfile.findOne({ userId });
      console.log('CandidateProfile found:', !!candidateProfile);
      if (candidateProfile) {
        profile = {
          education: candidateProfile.education,
          skills: candidateProfile.skills,
          preferences: candidateProfile.preferences,
          resume: candidateProfile.resume,
          experience: candidateProfile.experience,
          // ... other candidate fields
        };
      }
    } else if (role === 'employer') {
      console.log('Querying EmployerProfile with owner:', userId);
      const employerProfile = await EmployerProfile.findOne({ owner: userId });
      console.log('EmployerProfile found:', !!employerProfile);
      if (employerProfile) {
        profile = {
          company: employerProfile.company,
          position: employerProfile.position,
          contact: employerProfile.contact,
          businessInfo: employerProfile.businessInfo,
          legalRepresentative: employerProfile.legalRepresentative,
          // ... other employer fields
        };
      }
    }

    console.log('Final profile keys:', Object.keys(profile));
    console.log('================================================');

    return {
      user: this.formatUserResponse(user),
      profile,
    };
  }

  static formatUserResponse(user) {
    return {
      id: user._id,
      email: user.email,
      fullName: this.resolveFullName(user),
      role: user.role,
      authMethod: user.authMethod,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      avatar: user.avatar,
      phone: user.phone,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static resolveFullName(user) {
    if (user?.fullName && user.fullName.trim().length > 0) return user.fullName;
    if (user?.displayFullName && String(user.displayFullName).trim().length > 0)
      return String(user.displayFullName).trim();
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }
}

module.exports = UnifiedProfileService;
