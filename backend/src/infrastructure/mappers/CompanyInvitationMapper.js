/**
 * CompanyInvitationMapper
 * Maps between Mongoose models and CompanyInvitation domain entities
 * Pure transformation - no business logic
 */

const CompanyInvitation = require('../../domain/supporting/entities/CompanyInvitation');

class CompanyInvitationMapper {
  /**
   * Convert Mongoose document to domain entity
   * @param {Object} mongooseDoc - Mongoose CompanyInvitation document
   * @returns {CompanyInvitation|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) {
      return null;
    }

    try {
      // Map status enum (lowercase in DB to uppercase in domain)
      const statusMap = {
        pending: CompanyInvitation.Status.PENDING,
        accepted: CompanyInvitation.Status.ACCEPTED,
        rejected: CompanyInvitation.Status.REJECTED,
        expired: CompanyInvitation.Status.EXPIRED,
      };

      // Map role enum (lowercase in DB to uppercase in domain)
      const roleMap = {
        admin: CompanyInvitation.Role.ADMIN,
        recruiter: CompanyInvitation.Role.RECRUITER,
        interviewer: CompanyInvitation.Role.INTERVIEWER,
        viewer: CompanyInvitation.Role.VIEWER,
      };

      // Handle populated company
      const companyId =
        typeof mongooseDoc.company === 'object' && mongooseDoc.company?._id
          ? mongooseDoc.company._id.toString()
          : mongooseDoc.company?.toString();

      // Handle populated invitedBy
      const invitedBy =
        typeof mongooseDoc.invitedBy === 'object' && mongooseDoc.invitedBy?._id
          ? mongooseDoc.invitedBy._id.toString()
          : mongooseDoc.invitedBy?.toString();

      // Map permissions
      const permissions = {
        canPostJobs: mongooseDoc.permissions?.canPostJobs || false,
        canEditJobs: mongooseDoc.permissions?.canEditJobs || false,
        canDeleteJobs: mongooseDoc.permissions?.canDeleteJobs || false,
        canViewApplications:
          mongooseDoc.permissions?.canViewApplications || false,
        canReviewApplications:
          mongooseDoc.permissions?.canReviewApplications || false,
        canScheduleInterviews:
          mongooseDoc.permissions?.canScheduleInterviews || false,
        canManageMembers: mongooseDoc.permissions?.canManageMembers || false,
        canEditCompanyInfo:
          mongooseDoc.permissions?.canEditCompanyInfo || false,
      };

      // Map position
      let position = null;
      if (
        mongooseDoc.position &&
        (mongooseDoc.position.title || mongooseDoc.position.department)
      ) {
        position = {
          title: mongooseDoc.position.title || null,
          department: mongooseDoc.position.department || null,
        };
      }

      return new CompanyInvitation(
        mongooseDoc._id?.toString(),
        companyId,
        invitedBy,
        mongooseDoc.email,
        roleMap[mongooseDoc.role] || CompanyInvitation.Role.RECRUITER,
        permissions,
        position,
        statusMap[mongooseDoc.status] || CompanyInvitation.Status.PENDING,
        mongooseDoc.token,
        mongooseDoc.expiresAt,
        mongooseDoc.acceptedAt || null,
        mongooseDoc.createdAt,
        mongooseDoc.updatedAt
      );
    } catch (error) {
      console.error('Error mapping CompanyInvitation to domain:', error);
      return null;
    }
  }

  /**
   * Convert domain entity to Mongoose-compatible object
   * @param {CompanyInvitation} domainEntity - Domain CompanyInvitation entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    if (!domainEntity) {
      return null;
    }

    // Map status enum (uppercase in domain to lowercase in DB)
    const statusMap = {
      [CompanyInvitation.Status.PENDING]: 'pending',
      [CompanyInvitation.Status.ACCEPTED]: 'accepted',
      [CompanyInvitation.Status.REJECTED]: 'rejected',
      [CompanyInvitation.Status.EXPIRED]: 'expired',
    };

    // Map role enum (uppercase in domain to lowercase in DB)
    const roleMap = {
      [CompanyInvitation.Role.ADMIN]: 'admin',
      [CompanyInvitation.Role.RECRUITER]: 'recruiter',
      [CompanyInvitation.Role.INTERVIEWER]: 'interviewer',
      [CompanyInvitation.Role.VIEWER]: 'viewer',
    };

    const data = {
      company: domainEntity.companyId,
      invitedBy: domainEntity.invitedBy,
      email: domainEntity.email.toLowerCase(),
      role: roleMap[domainEntity.role] || 'recruiter',
      permissions: {
        canPostJobs: domainEntity.permissions.canPostJobs,
        canEditJobs: domainEntity.permissions.canEditJobs,
        canDeleteJobs: domainEntity.permissions.canDeleteJobs,
        canViewApplications: domainEntity.permissions.canViewApplications,
        canReviewApplications: domainEntity.permissions.canReviewApplications,
        canScheduleInterviews: domainEntity.permissions.canScheduleInterviews,
        canManageMembers: domainEntity.permissions.canManageMembers,
        canEditCompanyInfo: domainEntity.permissions.canEditCompanyInfo,
      },
      status: statusMap[domainEntity.status] || 'pending',
      token: domainEntity.token,
      expiresAt: domainEntity.expiresAt,
    };

    // Optional fields
    if (domainEntity.position !== null) {
      data.position = {
        title: domainEntity.position.title || undefined,
        department: domainEntity.position.department || undefined,
      };
    }

    if (domainEntity.acceptedAt !== null) {
      data.acceptedAt = domainEntity.acceptedAt;
    }

    if (domainEntity.createdAt !== null) {
      data.createdAt = domainEntity.createdAt;
    }

    if (domainEntity.updatedAt !== null) {
      data.updatedAt = domainEntity.updatedAt;
    }

    return data;
  }

  /**
   * Convert array of Mongoose documents to domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<CompanyInvitation>} Array of domain entities
   */
  static toDomainArray(mongooseDocs) {
    if (!mongooseDocs || !Array.isArray(mongooseDocs)) {
      return [];
    }

    return mongooseDocs
      .map(doc => this.toDomain(doc))
      .filter(entity => entity !== null);
  }

  /**
   * Convert domain entity to update object (excludes immutable fields)
   * @param {CompanyInvitation} domainEntity - Domain entity
   * @returns {Object} Update object for Mongoose
   */
  static toMongooseUpdate(domainEntity) {
    const data = this.toMongoose(domainEntity);

    // Remove fields that shouldn't be updated
    delete data.company; // Immutable
    delete data.invitedBy; // Immutable
    delete data.token; // Immutable
    delete data.createdAt; // Immutable

    // Ensure updatedAt is set
    data.updatedAt = new Date();

    return data;
  }

  /**
   * Create a lightweight DTO for invitation preview
   * @param {CompanyInvitation} domainEntity - Domain entity
   * @returns {Object} Lightweight invitation preview
   */
  static toPreview(domainEntity) {
    if (!domainEntity) {
      return null;
    }

    return {
      id: domainEntity.id,
      email: domainEntity.email,
      role: domainEntity.getRoleDisplayName(),
      status: domainEntity.getDisplayStatus(),
      expiresIn: domainEntity.getExpiryTimeRemainingInDays(),
      canBeAccepted: domainEntity.canBeAccepted(),
      createdAt: domainEntity.createdAt,
    };
  }
}

module.exports = CompanyInvitationMapper;
