const JobPosting = require('../../domain/recruitment/JobPosting');

/**
 * Mapper to convert between JobPosting Domain Entity and Mongoose Model
 * Pure data transformation - no defaults, no business logic, no mutations
 */
class JobPostingMapper {
  /**
   * Convert Mongoose Model to Domain Entity
   * Maps data as-is without adding defaults
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    const jobPosting = new JobPosting(
      mongooseDoc._id.toString(),
      mongooseDoc.title,
      mongooseDoc.description,
      mongooseDoc.companyId?.toString() || mongooseDoc.companyId
    );

    // Map fields directly without defaults
    jobPosting.employerId =
      mongooseDoc.employerId?.toString() || mongooseDoc.employerId;
    jobPosting.salaryMin = mongooseDoc.salaryRange?.min;
    jobPosting.salaryMax = mongooseDoc.salaryRange?.max;
    jobPosting.salaryCurrency = mongooseDoc.salaryRange?.currency;
    jobPosting.location = mongooseDoc.location;
    jobPosting.jobType = mongooseDoc.jobType;
    jobPosting.status = mongooseDoc.status;
    jobPosting.postedAt = mongooseDoc.postedAt;
    jobPosting.closedAt = mongooseDoc.closedAt;
    jobPosting.expiresAt = mongooseDoc.expiresAt;

    // Arrays and objects - convert strings back to arrays
    jobPosting.requirements = this._parseStringOrArray(
      mongooseDoc.requirements
    );
    jobPosting.skills = mongooseDoc.skills || [];
    jobPosting.experience = mongooseDoc.experience;
    jobPosting.education = mongooseDoc.education;
    jobPosting.benefits = this._parseStringOrArray(mongooseDoc.benefits);

    // Counters
    jobPosting.applicationCount = mongooseDoc.applicationCount;
    jobPosting.viewCount = mongooseDoc.viewCount;

    // Metadata
    jobPosting.createdAt = mongooseDoc.createdAt;
    jobPosting.updatedAt = mongooseDoc.updatedAt;

    return jobPosting;
  }

  /**
   * Convert Domain Entity to plain object for Mongoose
   * Returns only the data, let Mongoose handle defaults via schema
   */
  static toMongoose(domainEntity) {
    const data = {
      jobId: domainEntity.jobId,
      title: domainEntity.title,
      description: domainEntity.description,
      companyId: domainEntity.companyId,
      employerId: domainEntity.employerId,
      location: domainEntity.location,
      jobType: domainEntity.jobType,
      status: domainEntity.status,
    };

    // Only include salary if provided
    if (
      domainEntity.salaryMin !== undefined ||
      domainEntity.salaryMax !== undefined
    ) {
      data.salaryRange = {
        min: domainEntity.salaryMin,
        max: domainEntity.salaryMax,
        currency: domainEntity.salaryCurrency,
      };
    }

    // Optional timestamps
    if (domainEntity.postedAt) data.postedAt = domainEntity.postedAt;
    if (domainEntity.closedAt) data.closedAt = domainEntity.closedAt;
    if (domainEntity.expiresAt) data.expiresAt = domainEntity.expiresAt;

    // Optional arrays
    if (domainEntity.requirements)
      data.requirements = Array.isArray(domainEntity.requirements)
        ? domainEntity.requirements.join('\n')
        : domainEntity.requirements;
    if (domainEntity.skills) data.skills = domainEntity.skills;
    if (domainEntity.benefits)
      data.benefits = Array.isArray(domainEntity.benefits)
        ? domainEntity.benefits.join('\n')
        : domainEntity.benefits;

    // Optional fields
    if (domainEntity.experience !== undefined)
      data.experience = domainEntity.experience;
    if (domainEntity.education !== undefined)
      data.education = domainEntity.education;
    if (domainEntity.applicationCount !== undefined)
      data.applicationCount = domainEntity.applicationCount;
    if (domainEntity.viewCount !== undefined)
      data.viewCount = domainEntity.viewCount;

    return data;
  }

  /**
   * Helper method to parse string or array
   * Converts stored strings back to arrays for domain use
   */
  static _parseStringOrArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split('\n').filter(item => item.trim().length > 0);
    }
    return [];
  }
}

module.exports = JobPostingMapper;
