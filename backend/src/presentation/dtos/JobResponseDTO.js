/**
 * Job Response DTO
 * Presentation Layer - Data Transfer Object for Job API responses
 * Transforms infrastructure JobPost model into API-friendly format
 */

class JobResponseDTO {
  constructor(jobEntity) {
    // Handle both domain entities and mongoose models
    const isDomainEntity = jobEntity.constructor.name === 'JobPosting';

    this.id = isDomainEntity ? jobEntity.jobId : jobEntity._id;
    this.jobId = jobEntity.jobId;
    this.title = jobEntity.title;
    this.description = jobEntity.description;
    this.companyId = jobEntity.companyId;
    this.employmentType = jobEntity.employmentType;
    this.status = jobEntity.status;
    this.workFormat = jobEntity.workFormat;
    this.location = jobEntity.location;
    this.salaryMin = jobEntity.salaryMin;
    this.salaryMax = jobEntity.salaryMax;
    this.currency = jobEntity.salaryCurrency || jobEntity.currency || 'VND';
    this.experienceLevel = jobEntity.experienceLevel || jobEntity.experience;
    this.requiredEducation = jobEntity.requiredEducation || jobEntity.education;
    this.skills = jobEntity.skills || [];
    this.requirements = jobEntity.requirements;
    this.responsibilities = jobEntity.responsibilities;
    this.benefits = jobEntity.benefits;
    this.applicationDeadline = jobEntity.applicationDeadline;
    this.expiresAt = jobEntity.expiresAt;
    this.viewsCount = jobEntity.viewCount || jobEntity.viewsCount || 0;
    this.applicationsCount =
      jobEntity.applicationCount || jobEntity.applicationsCount || 0;
    this.metadata = jobEntity.metadata || {};
    this.createdAt = jobEntity.createdAt;
    this.updatedAt = jobEntity.updatedAt;

    // Computed fields
    this.isActive =
      jobEntity.status === 'published' || jobEntity.status === 'PUBLISHED';
    this.canApply = isDomainEntity
      ? jobEntity.isPublished() && !jobEntity.isExpired()
      : (jobEntity.status === 'published' ||
          jobEntity.status === 'PUBLISHED') &&
        (!jobEntity.expiresAt || jobEntity.expiresAt > new Date());
    this.isExpired = isDomainEntity
      ? jobEntity.isExpired()
      : jobEntity.expiresAt && jobEntity.expiresAt <= new Date();
    this.hasSalaryRange = isDomainEntity
      ? jobEntity.salaryMin !== null && jobEntity.salaryMax !== null
      : jobEntity.salaryMin !== null && jobEntity.salaryMax !== null;
  }

  /**
   * Create DTO from infrastructure JobPost model
   * @param {Object} jobPostModel - Mongoose JobPost model instance
   * @returns {JobResponseDTO}
   */
  static fromJobPost(jobPostModel) {
    return new JobResponseDTO(jobPostModel);
  }

  /**
   * Create DTO array from JobPost models array
   * @param {Array} jobPostModels - Array of JobPost model instances
   * @returns {Array<JobResponseDTO>}
   */
  static fromJobPosts(jobPostModels) {
    return jobPostModels.map(model => new JobResponseDTO(model));
  }

  /**
   * Convert to plain object for JSON response
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      jobId: this.jobId,
      title: this.title,
      description: this.description,
      companyId: this.companyId,
      employmentType: this.employmentType,
      status: this.status,
      workFormat: this.workFormat,
      location: this.location,
      salaryMin: this.salaryMin,
      salaryMax: this.salaryMax,
      currency: this.currency,
      experienceLevel: this.experienceLevel,
      requiredEducation: this.requiredEducation,
      skills: this.skills,
      requirements: this.requirements,
      responsibilities: this.responsibilities,
      benefits: this.benefits,
      applicationDeadline: this.applicationDeadline,
      expiresAt: this.expiresAt,
      viewsCount: this.viewsCount,
      applicationsCount: this.applicationsCount,
      metadata: this.metadata,
      isActive: this.isActive,
      canApply: this.canApply,
      isExpired: this.isExpired,
      hasSalaryRange: this.hasSalaryRange,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = JobResponseDTO;
