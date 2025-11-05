const JobStatus = require('../enums/JobStatus');
const { WorkFormat } = require('../enums/CompanySize');
const EmploymentType = require('../enums/EmploymentType');
const { EducationLevel } = require('../enums/CompanySize');

/**
 * JobPosting Entity
 * Domain: Core Recruitment
 * Represents a job posting by a company
 */
class JobPosting {
  constructor(props) {
    this._jobId = props.jobId;
    this._title = props.title;
    this._description = props.description;
    this._minSalary = props.minSalary || null;
    this._maxSalary = props.maxSalary || null;
    this._requiredExperienceLevel = props.requiredExperienceLevel || null;
    this._employmentType = props.employmentType || EmploymentType.FULL_TIME;
    this._requiredEducation =
      props.requiredEducation || EducationLevel.BACHELOR;
    this._viewsCount = props.viewsCount || 0;
    this._applicationsCount = props.applicationsCount || 0;
    this._status = props.status || JobStatus.DRAFT;
    this._workFormat = props.workFormat || WorkFormat.ON_SITE;
    this._expiresAt = props.expiresAt || null;

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._jobId) {
      throw new Error('Job ID is required');
    }
    if (!this._title) {
      throw new Error('Job title is required');
    }
    if (!this._description) {
      throw new Error('Job description is required');
    }
    if (!Object.values(JobStatus).includes(this._status)) {
      throw new Error('Invalid job status');
    }
    if (!Object.values(WorkFormat).includes(this._workFormat)) {
      throw new Error('Invalid work format');
    }
    if (!Object.values(EmploymentType).includes(this._employmentType)) {
      throw new Error('Invalid employment type');
    }
    if (!Object.values(EducationLevel).includes(this._requiredEducation)) {
      throw new Error('Invalid education level');
    }
  }

  // Getters
  get jobId() {
    return this._jobId;
  }
  get title() {
    return this._title;
  }
  get description() {
    return this._description;
  }
  get minSalary() {
    return this._minSalary;
  }
  get maxSalary() {
    return this._maxSalary;
  }
  get requiredExperienceLevel() {
    return this._requiredExperienceLevel;
  }
  get employmentType() {
    return this._employmentType;
  }
  get requiredEducation() {
    return this._requiredEducation;
  }
  get viewsCount() {
    return this._viewsCount;
  }
  get applicationsCount() {
    return this._applicationsCount;
  }
  get status() {
    return this._status;
  }
  get workFormat() {
    return this._workFormat;
  }
  get expiresAt() {
    return this._expiresAt;
  }

  /**
   * Publish the job posting
   */
  publish() {
    this._status = JobStatus.OPEN;
    this._updatedAt = new Date();
  }

  /**
   * Close the job posting
   */
  close() {
    this._status = JobStatus.CLOSED;
    this._updatedAt = new Date();
  }

  /**
   * Update job details
   * @param {string} title
   * @param {string} desc
   */
  updateDetails(title, desc) {
    if (title) this._title = title;
    if (desc) this._description = desc;
    this._updatedAt = new Date();
  }

  /**
   * Check if job is expired
   * @returns {boolean}
   */
  isExpired() {
    return this._expiresAt && this._expiresAt < new Date();
  }

  /**
   * Get days until expiry
   * @returns {number}
   */
  daysUntilExpiry() {
    if (!this._expiresAt) return null;
    const diffTime = this._expiresAt - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Increment views count
   */
  incrementViews() {
    this._viewsCount++;
    this._updatedAt = new Date();
  }

  /**
   * Add skill requirement
   * @param {string} skill
   * @param {string} level
   * @param {boolean} isPreferred
   */
  addSkillRequirement(skill, level, isPreferred) {
    // This would create a JobSkillRequirement entity
    const JobSkillRequirement = require('../../master-data/entities/JobSkillRequirement');
    return new JobSkillRequirement({
      jobId: this._jobId,
      skillName: skill,
      level: level,
      isPreferred: isPreferred,
    });
  }

  /**
   * Set work location
   * @param {Address} address
   */
  setWorkLocation(address) {
    // This would set the work location
    return address;
  }

  /**
   * Get work location
   * @returns {Address}
   */
  getWorkLocation() {
    // This would return the work location
    return null;
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      jobId: this._jobId,
      title: this._title,
      description: this._description,
      minSalary: this._minSalary,
      maxSalary: this._maxSalary,
      requiredExperienceLevel: this._requiredExperienceLevel,
      employmentType: this._employmentType,
      requiredEducation: this._requiredEducation,
      viewsCount: this._viewsCount,
      applicationsCount: this._applicationsCount,
      status: this._status,
      workFormat: this._workFormat,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = JobPosting;
