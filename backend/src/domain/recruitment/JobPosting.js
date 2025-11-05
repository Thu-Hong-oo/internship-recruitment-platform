const JobType = require('./JobType');
const JobStatus = require('./JobStatus');

/**
 * JobPosting Domain Entity
 * Rich domain model with business logic and invariants
 */
class JobPosting {
  constructor(jobId, title, description, companyId) {
    // Validate required fields
    this._validateRequired(jobId, 'Job ID');
    this._validateString(title, 'Title');
    this._validateString(description, 'Description');
    this._validateRequired(companyId, 'Company ID');

    // Required fields
    this.jobId = jobId;
    this.title = title.trim();
    this.description = description.trim();
    this.companyId = companyId;

    // Optional fields with safe defaults
    this.employerId = null;
    this.salaryMin = null;
    this.salaryMax = null;
    this.salaryCurrency = 'VND';
    this.location = null;
    this.jobType = null;
    this.status = JobStatus.DRAFT; // Safe default
    this.postedAt = null;
    this.closedAt = null;
    this.expiresAt = null;

    // Collections - empty arrays instead of null
    this.requirements = [];
    this.skills = [];
    this.benefits = [];

    // Optional single values
    this.experience = null;
    this.education = null;

    // Counters - 0 instead of null
    this.applicationCount = 0;
    this.viewCount = 0;

    // Timestamps
    this.createdAt = null;
    this.updatedAt = null;
  }

  // ==================== STATE TRANSITIONS ====================

  publish() {
    if (this.status === JobStatus.PUBLISHED) {
      throw new Error('Job posting is already published');
    }
    if (this.status !== JobStatus.DRAFT) {
      throw new Error('Only draft jobs can be published');
    }

    // Validate required fields for publishing
    this._validatePublishRequirements();

    this.status = JobStatus.PUBLISHED;
    this.postedAt = new Date();
  }

  close() {
    if (this.status === JobStatus.CLOSED) {
      throw new Error('Job posting is already closed');
    }
    if (this.status !== JobStatus.PUBLISHED) {
      throw new Error('Only published jobs can be closed');
    }

    this.status = JobStatus.CLOSED;
    this.closedAt = new Date();
  }

  unpublish() {
    if (this.status !== JobStatus.PUBLISHED) {
      throw new Error('Only published jobs can be unpublished');
    }
    this.status = JobStatus.DRAFT;
    this.postedAt = null;
  }

  // ==================== UPDATES ====================

  updateDetails(title, description) {
    if (!this.canBeEdited()) {
      throw new Error('Cannot edit closed job posting');
    }

    if (title !== undefined && title !== null) {
      this._validateString(title, 'Title');
      this.title = title.trim();
    }

    if (description !== undefined && description !== null) {
      this._validateString(description, 'Description');
      this.description = description.trim();
    }
  }

  setSalaryRange(min, max, currency = 'VND') {
    if (!this.canBeEdited()) {
      throw new Error('Cannot edit closed job posting');
    }

    // Validate types
    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new Error('Salary values must be numbers');
    }

    // Validate values
    if (min < 0 || max < 0) {
      throw new Error('Salary cannot be negative');
    }
    if (min > max) {
      throw new Error('Minimum salary cannot exceed maximum salary');
    }

    this.salaryMin = min;
    this.salaryMax = max;
    this.salaryCurrency = currency;
  }

  // ==================== COLLECTIONS ====================

  addRequirement(requirement) {
    if (!this.canBeEdited()) {
      throw new Error('Cannot edit closed job posting');
    }

    this._validateString(requirement, 'Requirement');

    const trimmed = requirement.trim();
    if (!this.requirements.includes(trimmed)) {
      this.requirements.push(trimmed);
    }
  }

  removeRequirement(requirement) {
    if (!this.canBeEdited()) {
      throw new Error('Cannot edit closed job posting');
    }

    const index = this.requirements.indexOf(requirement);
    if (index > -1) {
      this.requirements.splice(index, 1);
    }
  }

  addSkill(skill) {
    if (!this.canBeEdited()) {
      throw new Error('Cannot edit closed job posting');
    }

    this._validateString(skill, 'Skill');

    const trimmed = skill.trim();
    if (!this.skills.includes(trimmed)) {
      this.skills.push(trimmed);
    }
  }

  removeSkill(skill) {
    if (!this.canBeEdited()) {
      throw new Error('Cannot edit closed job posting');
    }

    const index = this.skills.indexOf(skill);
    if (index > -1) {
      this.skills.splice(index, 1);
    }
  }

  // ==================== COUNTERS ====================

  incrementViewCount() {
    if (!this.isPublished()) {
      throw new Error('Cannot increment view count for non-published job');
    }
    this.viewCount++;
  }

  incrementApplicationCount() {
    if (!this.isPublished()) {
      throw new Error(
        'Cannot increment application count for non-published job'
      );
    }
    this.applicationCount++;
  }

  // ==================== QUERIES ====================

  isPublished() {
    return this.status === JobStatus.PUBLISHED;
  }

  isActive() {
    return this.status === JobStatus.PUBLISHED && !this.isExpired();
  }

  isClosed() {
    return this.status === JobStatus.CLOSED;
  }

  isDraft() {
    return this.status === JobStatus.DRAFT;
  }

  isExpired() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  canBeEdited() {
    return (
      this.status === JobStatus.DRAFT || this.status === JobStatus.PUBLISHED
    );
  }

  canReceiveApplications() {
    return this.isPublished() && !this.isExpired();
  }

  // ==================== VALIDATION HELPERS ====================

  _validateRequired(value, fieldName) {
    if (!value) {
      throw new Error(`${fieldName} is required`);
    }
  }

  _validateString(value, fieldName) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`${fieldName} must be a non-empty string`);
    }
  }

  _validatePublishRequirements() {
    const errors = [];

    if (!this.title || !this.title.trim()) {
      errors.push('Title is required');
    }
    if (!this.description || !this.description.trim()) {
      errors.push('Description is required');
    }
    if (!this.location) {
      errors.push('Location is required');
    }
    if (!this.jobType) {
      errors.push('Job type is required');
    }

    if (errors.length > 0) {
      throw new Error(`Cannot publish job: ${errors.join(', ')}`);
    }
  }
}

module.exports = JobPosting;
