const EmployerProfile = require('../../domain/recruitment/EmployerProfile');

/**
 * EmployerProfileMapper
 * Infrastructure layer - converts between Domain Entity and Mongoose Model
 * Pure transformation - no defaults, no business logic, no mutations
 */
class EmployerProfileMapper {
  /**
   * Convert Mongoose Model to Domain Entity
   * Maps data as-is without adding defaults
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    const profile = new EmployerProfile(
      mongooseDoc._id.toString(),
      mongooseDoc.owner?.toString() || mongooseDoc.owner,
      mongooseDoc.company?._id?.toString() ||
        mongooseDoc.company?.toString() ||
        mongooseDoc.company
    );

    // Map fields directly without defaults
    profile.role = mongooseDoc.role;
    profile.status = mongooseDoc.status;
    profile.joinedAt = mongooseDoc.joinedAt;

    // Position object
    if (mongooseDoc.position) {
      profile.position = {
        title: mongooseDoc.position.title,
        level: mongooseDoc.position.level,
        department: mongooseDoc.position.department,
      };
    }

    // Permissions object
    if (mongooseDoc.permissions) {
      profile.permissions = {
        canPostJobs: mongooseDoc.permissions.canPostJobs,
        canEditJobs: mongooseDoc.permissions.canEditJobs,
        canDeleteJobs: mongooseDoc.permissions.canDeleteJobs,
        canViewApplications: mongooseDoc.permissions.canViewApplications,
        canReviewApplications: mongooseDoc.permissions.canReviewApplications,
        canScheduleInterviews: mongooseDoc.permissions.canScheduleInterviews,
        canManageMembers: mongooseDoc.permissions.canManageMembers,
        canEditCompanyInfo: mongooseDoc.permissions.canEditCompanyInfo,
      };
    }

    // Contact object
    if (mongooseDoc.contact) {
      profile.contact = {
        phone: mongooseDoc.contact.phone,
        email: mongooseDoc.contact.email,
      };
    }

    // Company object (populated)
    if (mongooseDoc.company) {
      profile.company = mongooseDoc.company;
    }

    // Timestamps
    profile.createdAt = mongooseDoc.createdAt;
    profile.updatedAt = mongooseDoc.updatedAt;

    return profile;
  }

  /**
   * Convert Domain Entity to plain object for Mongoose
   * Returns only the data, let Mongoose handle defaults via schema
   */
  static toMongoose(domainEntity) {
    const data = {
      owner: domainEntity.userId,
      company: domainEntity.companyId,
    };

    // Optional fields
    if (domainEntity.role !== undefined) data.role = domainEntity.role;
    if (domainEntity.status !== undefined) data.status = domainEntity.status;
    if (domainEntity.joinedAt !== undefined)
      data.joinedAt = domainEntity.joinedAt;

    // Position object
    if (domainEntity.position !== undefined) {
      data.position = {
        title: domainEntity.position.title,
        level: domainEntity.position.level,
        department: domainEntity.position.department,
      };
    }

    // Permissions object
    if (domainEntity.permissions !== undefined) {
      data.permissions = {
        canPostJobs: domainEntity.permissions.canPostJobs,
        canEditJobs: domainEntity.permissions.canEditJobs,
        canDeleteJobs: domainEntity.permissions.canDeleteJobs,
        canViewApplications: domainEntity.permissions.canViewApplications,
        canReviewApplications: domainEntity.permissions.canReviewApplications,
        canScheduleInterviews: domainEntity.permissions.canScheduleInterviews,
        canManageMembers: domainEntity.permissions.canManageMembers,
        canEditCompanyInfo: domainEntity.permissions.canEditCompanyInfo,
      };
    }

    // Contact object
    if (domainEntity.contact !== undefined) {
      data.contact = {
        phone: domainEntity.contact.phone,
        email: domainEntity.contact.email,
      };
    }

    return data;
  }
}

module.exports = EmployerProfileMapper;
