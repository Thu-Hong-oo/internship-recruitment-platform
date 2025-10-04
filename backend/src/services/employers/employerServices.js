// ============================================
// employerService.js - IMPROVED VERSION
// ============================================

const EmployerProfile = require('../../models/EmployerProfile');
const User = require('../../models/User');
const { uploadImage, deleteImage } = require('../imageUploadService');
const { AppError } = require('../../utils/errors');
const { logger } = require('../../utils/logger');

class EmployerService {
  /**
   * Get employer profile (don't auto-create)
   */
  static async getProfile(userId, options = {}) {
    const { populate = false, lean = false } = options;

    let query = EmployerProfile.findOne({ owner: userId });

    if (populate) {
      query = query.populate('owner', 'email fullName avatar');
      query = query.populate('members.user', 'email fullName avatar');
    }

    if (lean) {
      query = query.lean();
    }

    const profile = await query;

    if (!profile && options.required) {
      throw new AppError('Employer profile not found', 404);
    }

    return profile;
  }

  /**
   * Create new employer profile
   */
  static async createProfile(userId, data) {
    try {
      // Check if profile already exists
      const existing = await EmployerProfile.findOne({ owner: userId });
      if (existing) {
        throw new AppError('Employer profile already exists', 400);
      }

      // Validate required fields
      const required = [
        'company.name',
        'company.email',
        'company.industry',
        'company.size',
      ];
      for (const field of required) {
        const value = field.split('.').reduce((obj, key) => obj?.[key], data);
        if (!value) {
          throw new AppError(`Missing required field: ${field}`, 400);
        }
      }

      // Create profile
      const profile = await EmployerProfile.create({
        owner: userId,
        ...data,
      });

      // Update user reference
      await User.findByIdAndUpdate(userId, {
        employerProfile: profile._id,
      });

      logger.info('Employer profile created', {
        userId,
        profileId: profile._id,
      });

      return profile;
    } catch (error) {
      logger.error('Error creating employer profile', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update profile basic info
   */
  static async updateProfile(userId, updates) {
    const profile = await this.getProfile(userId, { required: true });

    // Allowed fields to update
    const allowedFields = ['position', 'contact', 'legalRepresentative'];

    // Apply updates
    for (const field of allowedFields) {
      if (updates[field]) {
        profile[field] = { ...profile[field], ...updates[field] };
      }
    }

    await profile.save();

    logger.info('Employer profile updated', {
      userId,
      profileId: profile._id,
    });

    return profile;
  }

  /**
   * Update company info
   */
  static async updateCompanyInfo(userId, updates) {
    const profile = await this.getProfile(userId, { required: true });

    // Allowed fields
    const allowedFields = ['company', 'businessInfo'];

    for (const field of allowedFields) {
      if (updates[field]) {
        profile[field] = { ...profile[field], ...updates[field] };
      }
    }

    await profile.save();

    logger.info('Company info updated', {
      userId,
      profileId: profile._id,
    });

    return profile;
  }

  /**
   * Upload company logo
   */
  static async uploadLogo(userId, file) {
    try {
      const profile = await this.getProfile(userId, { required: true });

      // Validate file
      if (!file || !file.buffer) {
        throw new AppError('No file provided', 400);
      }

      // Delete old logo if exists
      if (profile.company?.logo?.cloudinaryId) {
        try {
          await deleteImage(profile.company.logo.cloudinaryId);
        } catch (error) {
          logger.warn('Failed to delete old logo', {
            error: error.message,
          });
        }
      }

      // Upload new logo
      const uploadResult = await uploadImage('logo', file.buffer, {
        folder: 'company-logos',
        public_id: `logo_${userId}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      // Update profile
      profile.company.logo = {
        url: uploadResult.url,
        cloudinaryId: uploadResult.publicId,
        filename: uploadResult.publicId,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };

      await profile.save();

      logger.info('Logo uploaded', {
        userId,
        profileId: profile._id,
        cloudinaryId: uploadResult.publicId,
      });

      return {
        logo: profile.company.logo,
        employerProfileId: profile._id,
      };
    } catch (error) {
      logger.error('Error uploading logo', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove company logo
   */
  static async removeLogo(userId) {
    const profile = await this.getProfile(userId, { required: true });

    if (!profile.company?.logo?.cloudinaryId) {
      throw new AppError('No logo to remove', 404);
    }

    // Delete from Cloudinary
    await deleteImage(profile.company.logo.cloudinaryId);

    // Remove from profile
    profile.company.logo = undefined;
    await profile.save();

    logger.info('Logo removed', { userId, profileId: profile._id });

    return { message: 'Logo removed successfully' };
  }

  /**
   * Upload cover image
   */
  static async uploadCoverImage(userId, file) {
    try {
      const profile = await this.getProfile(userId, { required: true });

      if (!file || !file.buffer) {
        throw new AppError('No file provided', 400);
      }

      // Delete old cover if exists
      if (profile.company?.coverImage?.cloudinaryId) {
        try {
          await deleteImage(profile.company.coverImage.cloudinaryId);
        } catch (error) {
          logger.warn('Failed to delete old cover', {
            error: error.message,
          });
        }
      }

      // Upload new cover
      const uploadResult = await uploadImage('cover', file.buffer, {
        folder: 'company-covers',
        public_id: `cover_${userId}_${Date.now()}`,
        transformation: [
          { width: 1200, height: 400, crop: 'fill' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      // Update profile
      profile.company.coverImage = {
        url: uploadResult.url,
        cloudinaryId: uploadResult.publicId,
        filename: uploadResult.publicId,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };

      await profile.save();

      logger.info('Cover image uploaded', {
        userId,
        profileId: profile._id,
        cloudinaryId: uploadResult.publicId,
      });

      return {
        coverImage: profile.company.coverImage,
        employerProfileId: profile._id,
      };
    } catch (error) {
      logger.error('Error uploading cover', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove cover image
   */
  static async removeCoverImage(userId) {
    const profile = await this.getProfile(userId, { required: true });

    if (!profile.company?.coverImage?.cloudinaryId) {
      throw new AppError('No cover image to remove', 404);
    }

    await deleteImage(profile.company.coverImage.cloudinaryId);

    profile.company.coverImage = undefined;
    await profile.save();

    logger.info('Cover image removed', { userId, profileId: profile._id });

    return { message: 'Cover image removed successfully' };
  }

  /**
   * Add team member
   */
  static async addMember(userId, memberData) {
    const profile = await this.getProfile(userId, { required: true });

    // Check if owner has permission
    if (!profile.userCan(userId, 'canManageTeam')) {
      throw new AppError('No permission to manage team', 403);
    }

    // Check subscription limits
    const activeMembers = profile.getActiveMembers();
    if (activeMembers.length >= profile.subscription.features.maxTeamMembers) {
      throw new AppError('Team member limit reached', 400);
    }

    await profile.addMember(memberData.userId, memberData.role);

    logger.info('Team member added', {
      userId,
      profileId: profile._id,
      newMemberId: memberData.userId,
    });

    return profile;
  }

  /**
   * Remove team member
   */
  static async removeMember(userId, memberUserId) {
    const profile = await this.getProfile(userId, { required: true });

    if (!profile.userCan(userId, 'canManageTeam')) {
      throw new AppError('No permission to manage team', 403);
    }

    await profile.removeMember(memberUserId);

    logger.info('Team member removed', {
      userId,
      profileId: profile._id,
      removedMemberId: memberUserId,
    });

    return profile;
  }

  /**
   * Update member permissions
   */
  static async updateMemberPermissions(userId, memberUserId, permissions) {
    const profile = await this.getProfile(userId, { required: true });

    if (!profile.userCan(userId, 'canManageTeam')) {
      throw new AppError('No permission to manage team', 403);
    }

    const member = profile.members.find(
      m => m.user.toString() === memberUserId
    );

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    member.permissions = { ...member.permissions, ...permissions };
    await profile.save();

    logger.info('Member permissions updated', {
      userId,
      profileId: profile._id,
      memberId: memberUserId,
    });

    return profile;
  }

  /**
   * Get company statistics
   */
  static async getStatistics(userId) {
    const profile = await this.getProfile(userId, { required: true });
    await profile.updateStats();

    return {
      stats: profile.stats,
      engagement: profile.engagement,
      reputation: profile.reputation,
      subscription: profile.subscription,
    };
  }

  /**
   * Search employer profiles
   */
  static async search(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      industry,
      location,
      verified = true,
      sortBy = '-reputation.rating.overall',
    } = options;

    const filter = { status: 'verified' };

    if (query) {
      filter.$text = { $search: query };
    }

    if (industry) {
      filter['company.industry'] = new RegExp(industry, 'i');
    }

    if (location) {
      filter['company.officeAddress.city'] = new RegExp(location, 'i');
    }

    if (verified !== undefined) {
      filter['verification.isVerified'] = verified;
    }

    const total = await EmployerProfile.countDocuments(filter);
    const profiles = await EmployerProfile.find(filter)
      .select('company reputation stats engagement')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      profiles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Increment profile view
   */
  static async incrementView(profileId) {
    await EmployerProfile.findByIdAndUpdate(profileId, {
      $inc: { 'engagement.profileViews': 1 },
    });
  }
}

module.exports = EmployerService;
