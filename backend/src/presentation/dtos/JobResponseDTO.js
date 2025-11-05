/**
 * Job Response DTO
 * Presentation Layer - Data Transfer Object for Job API responses
 * Transforms infrastructure JobPost model into API-friendly format
 */

class JobResponseDTO {
  constructor(jobPostModel) {
    this.id = jobPostModel._id;
    this.jobId = jobPostModel.jobId;
    this.title = jobPostModel.title;
    this.description = jobPostModel.description;
    this.companyId = jobPostModel.companyId;
    this.employmentType = jobPostModel.employmentType;
    this.status = jobPostModel.status;
    this.workFormat = jobPostModel.workFormat;
    this.location = jobPostModel.location;
    this.salaryMin = jobPostModel.salaryMin;
    this.salaryMax = jobPostModel.salaryMax;
    this.currency = jobPostModel.currency || 'VND';
    this.experienceLevel = jobPostModel.experienceLevel;
    this.requiredEducation = jobPostModel.requiredEducation;
    this.skills = jobPostModel.skills || [];
    this.requirements = jobPostModel.requirements;
    this.responsibilities = jobPostModel.responsibilities;
    this.benefits = jobPostModel.benefits;
    this.applicationDeadline = jobPostModel.applicationDeadline;
    this.expiresAt = jobPostModel.expiresAt;
    this.viewsCount = jobPostModel.viewsCount || 0;
    this.applicationsCount = jobPostModel.applicationsCount || 0;
    this.metadata = jobPostModel.metadata || {};
    this.createdAt = jobPostModel.createdAt;
    this.updatedAt = jobPostModel.updatedAt;

    // Computed fields
    this.isActive =
      jobPostModel.status === 'ACTIVE' || jobPostModel.status === 'active';
    this.canApply = jobPostModel.canApply();
    this.isExpired = jobPostModel.isExpired();
    this.hasSalaryRange = jobPostModel.hasSalaryRange();
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
