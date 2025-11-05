const CompanyInvitationModel = require('../models/CompanyInvitation');
const CompanyInvitationMapper = require('../mappers/CompanyInvitationMapper');
const { logger } = require('../../shared/utils/logger');
const crypto = require('crypto');

/**
 * CompanyInvitationRepository
 * Infrastructure layer repository for CompanyInvitation entity
 * Returns domain entities using CompanyInvitationMapper
 */
class CompanyInvitationRepository {
  /**
   * Create new invitation with auto-generated token
   * @param {CompanyInvitation} entity - Domain entity
   * @returns {Promise<CompanyInvitation>} Created domain entity
   */
  async create(entity) {
    try {
      // Generate unique token if not provided
      if (!entity.token) {
        entity.setToken(crypto.randomBytes(32).toString('hex'));
      }

      const data = CompanyInvitationMapper.toMongoose(entity);
      const doc = new CompanyInvitationModel(data);
      const saved = await doc.save();

      return CompanyInvitationMapper.toDomain(saved);
    } catch (error) {
      logger.error('Create invitation error:', error);
      throw error;
    }
  }

  /**
   * Find invitation by ID
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<CompanyInvitation|null>} Domain entity or null
   */
  async findById(invitationId) {
    try {
      const doc = await CompanyInvitationModel.findById(invitationId)
        .populate('company', 'name logo industry location website')
        .populate('invitedBy', 'firstName lastName email avatar avatarUrl');

      return CompanyInvitationMapper.toDomain(doc);
    } catch (error) {
      logger.error('Find invitation by ID error:', error);
      throw error;
    }
  }

  /**
   * Find invitation by unique token
   * @param {string} token - Invitation token
   * @returns {Promise<CompanyInvitation|null>} Domain entity or null
   */
  async findByToken(token) {
    try {
      const doc = await CompanyInvitationModel.findOne({ token })
        .populate('company', 'name logo industry location website')
        .populate('invitedBy', 'firstName lastName email avatar avatarUrl');

      return CompanyInvitationMapper.toDomain(doc);
    } catch (error) {
      logger.error('Find invitation by token error:', error);
      throw error;
    }
  }

  /**
   * Find invitations by email
   * @param {string} email - Email address
   * @param {string} companyId - Company ID (optional)
   * @param {string} status - Status filter (optional)
   * @returns {Promise<Array<CompanyInvitation>>} Array of domain entities
   */
  async findByEmail(email, companyId = null, status = 'pending') {
    try {
      const query = { email: email.toLowerCase() };

      if (status) {
        query.status = status;
      }

      if (companyId) {
        query.company = companyId;
      }

      const docs = await CompanyInvitationModel.find(query)
        .populate('company', 'name logo')
        .populate('invitedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return CompanyInvitationMapper.toDomainArray(docs);
    } catch (error) {
      logger.error('Find invitations by email error:', error);
      throw error;
    }
  }

  /**
   * Find all invitations for a company
   * @param {string} companyId - Company ID
   * @param {string} status - Status filter (optional)
   * @returns {Promise<Array<CompanyInvitation>>} Array of domain entities
   */
  async findByCompany(companyId, status = null) {
    try {
      const query = { company: companyId };

      if (status) {
        query.status = status;
      }

      const docs = await CompanyInvitationModel.find(query)
        .populate('invitedBy', 'firstName lastName email avatar avatarUrl')
        .sort({ createdAt: -1 });

      return CompanyInvitationMapper.toDomainArray(docs);
    } catch (error) {
      logger.error('Find invitations by company error:', error);
      throw error;
    }
  }

  /**
   * Find pending invitations for a company
   * @param {string} companyId - Company ID
   * @returns {Promise<Array<CompanyInvitation>>} Array of domain entities
   */
  async findPendingByCompany(companyId) {
    return await this.findByCompany(companyId, 'pending');
  }

  /**
   * Find invitations by role
   * @param {string} companyId - Company ID
   * @param {string} role - Role filter
   * @returns {Promise<Array<CompanyInvitation>>} Array of domain entities
   */
  async findByRole(companyId, role) {
    try {
      const docs = await CompanyInvitationModel.find({
        company: companyId,
        role: role.toLowerCase(),
      })
        .populate('invitedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return CompanyInvitationMapper.toDomainArray(docs);
    } catch (error) {
      logger.error('Find invitations by role error:', error);
      throw error;
    }
  }

  /**
   * Update invitation
   * @param {string} invitationId - Invitation ID
   * @param {CompanyInvitation} entity - Domain entity with updates
   * @returns {Promise<CompanyInvitation|null>} Updated domain entity
   */
  async update(invitationId, entity) {
    try {
      const data = CompanyInvitationMapper.toMongooseUpdate(entity);
      const updated = await CompanyInvitationModel.findByIdAndUpdate(
        invitationId,
        { $set: data },
        { new: true, runValidators: true }
      );

      return CompanyInvitationMapper.toDomain(updated);
    } catch (error) {
      logger.error('Update invitation error:', error);
      throw error;
    }
  }

  /**
   * Accept invitation
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<CompanyInvitation|null>} Updated domain entity
   */
  async accept(invitationId) {
    try {
      const updated = await CompanyInvitationModel.findByIdAndUpdate(
        invitationId,
        {
          $set: {
            status: 'accepted',
            acceptedAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      return CompanyInvitationMapper.toDomain(updated);
    } catch (error) {
      logger.error('Accept invitation error:', error);
      throw error;
    }
  }

  /**
   * Reject invitation
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<CompanyInvitation|null>} Updated domain entity
   */
  async reject(invitationId) {
    try {
      const updated = await CompanyInvitationModel.findByIdAndUpdate(
        invitationId,
        {
          $set: {
            status: 'rejected',
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      return CompanyInvitationMapper.toDomain(updated);
    } catch (error) {
      logger.error('Reject invitation error:', error);
      throw error;
    }
  }

  /**
   * Mark invitation as expired
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<CompanyInvitation|null>} Updated domain entity
   */
  async markAsExpired(invitationId) {
    try {
      const updated = await CompanyInvitationModel.findByIdAndUpdate(
        invitationId,
        {
          $set: {
            status: 'expired',
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      return CompanyInvitationMapper.toDomain(updated);
    } catch (error) {
      logger.error('Mark invitation as expired error:', error);
      throw error;
    }
  }

  /**
   * Delete expired invitations (cleanup job)
   * @returns {Promise<number>} Number of deleted invitations
   */
  async deleteExpired() {
    try {
      const result = await CompanyInvitationModel.deleteMany({
        expiresAt: { $lt: new Date() },
        status: { $in: ['pending', 'expired'] },
      });

      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Delete expired invitations error:', error);
      throw error;
    }
  }

  /**
   * Find invitations expiring soon
   * @param {number} hours - Hours until expiry
   * @returns {Promise<Array<CompanyInvitation>>} Array of domain entities
   */
  async findExpiringSoon(hours = 24) {
    try {
      const expiryThreshold = new Date(Date.now() + hours * 60 * 60 * 1000);

      const docs = await CompanyInvitationModel.find({
        status: 'pending',
        expiresAt: {
          $gte: new Date(),
          $lte: expiryThreshold,
        },
      })
        .populate('company', 'name logo')
        .populate('invitedBy', 'firstName lastName email');

      return CompanyInvitationMapper.toDomainArray(docs);
    } catch (error) {
      logger.error('Find expiring invitations error:', error);
      throw error;
    }
  }

  /**
   * Count invitations by company
   * @param {string} companyId - Company ID
   * @param {string} status - Status filter (optional)
   * @returns {Promise<number>} Count
   */
  async countByCompany(companyId, status = null) {
    try {
      const query = { company: companyId };

      if (status) {
        query.status = status;
      }

      return await CompanyInvitationModel.countDocuments(query);
    } catch (error) {
      logger.error('Count invitations error:', error);
      throw error;
    }
  }

  /**
   * Check if invitation exists for email and company
   * @param {string} email - Email address
   * @param {string} companyId - Company ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(email, companyId) {
    try {
      const count = await CompanyInvitationModel.countDocuments({
        email: email.toLowerCase(),
        company: companyId,
        status: 'pending',
      });

      return count > 0;
    } catch (error) {
      logger.error('Check invitation exists error:', error);
      throw error;
    }
  }

  /**
   * Resend invitation (create new one and expire old)
   * @param {string} oldInvitationId - Old invitation ID
   * @param {CompanyInvitation} newEntity - New domain entity
   * @returns {Promise<CompanyInvitation>} New domain entity
   */
  async resend(oldInvitationId, newEntity) {
    try {
      // Mark old invitation as expired
      await this.markAsExpired(oldInvitationId);

      // Create new invitation
      return await this.create(newEntity);
    } catch (error) {
      logger.error('Resend invitation error:', error);
      throw error;
    }
  }
}

module.exports = CompanyInvitationRepository;
