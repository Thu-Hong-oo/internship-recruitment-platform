const JobStatus = require('../enums/JobStatus');
const EmploymentType = require('../enums/EmploymentType');
const SalaryRange = require('../value-objects/SalaryRange');
const JobRequirements = require('../value-objects/JobRequirements');

/**
 * Job Entity
 * Domain: Recruitment
 * Represents a job posting
 */
class Job {
  constructor(props) {
    this._jobId = props.jobId;
    this._title = props.title;
    this._description = props.description;
    this._companyId = props.companyId;
    this._employerId = props.employerId;
    this._status = props.status || JobStatus.DRAFT;
    this._employmentType = props.employmentType;
    this._location = props.location || null;
    this._isRemote = props.isRemote !== undefined ? props.isRemote : false;
    this._salaryRange = props.salaryRange; // SalaryRange value object
    this._requirements = props.requirements; // JobRequirements value object
    this._applicationDeadline = props.applicationDeadline || null;
    this._postedDate = props.postedDate || new Date();
    this._tags = Array.isArray(props.tags) ? [...props.tags] : [];

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._title || this._title.trim().length === 0) {
      throw new Error('Job title is required');
    }

    if (this._title.length > 200) {
      throw new Error('Job title cannot exceed 200 characters');
    }

    if (!this._description || this._description.trim().length === 0) {
      throw new Error('Job description is required');
    }

    if (!this._companyId) {
      throw new Error('Company ID is required');
    }

    if (!this._employerId) {
      throw new Error('Employer ID is required');
    }

    if (!Object.values(JobStatus).includes(this._status)) {
      throw new Error('Invalid job status');
    }

    if (!Object.values(EmploymentType).includes(this._employmentType)) {
      throw new Error('Invalid employment type');
    }

    if (this._location && typeof this._location !== 'string') {
      throw new Error('Location must be a string');
    }

    if (!(this._salaryRange instanceof SalaryRange)) {
      throw new Error('Salary range must be a SalaryRange value object');
    }

    if (!(this._requirements instanceof JobRequirements)) {
      throw new Error('Requirements must be a JobRequirements value object');
    }

    if (
      this._applicationDeadline &&
      !(this._applicationDeadline instanceof Date)
    ) {
      throw new Error('Application deadline must be a Date object');
    }

    if (
      !Array.isArray(this._tags) ||
      !this._tags.every(tag => typeof tag === 'string')
    ) {
      throw new Error('Tags must be an array of strings');
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

  get companyId() {
    return this._companyId;
  }

  get employerId() {
    return this._employerId;
  }

  get status() {
    return this._status;
  }

  get employmentType() {
    return this._employmentType;
  }

  get location() {
    return this._location;
  }

  get isRemote() {
    return this._isRemote;
  }

  get salaryRange() {
    return this._salaryRange;
  }

  get requirements() {
    return this._requirements;
  }

  get applicationDeadline() {
    return this._applicationDeadline;
  }

  get postedDate() {
    return this._postedDate;
  }

  get tags() {
    return [...this._tags];
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  // Business methods
  updateTitle(newTitle) {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error('Job title cannot be empty');
    }
    this._title = newTitle.trim();
    this._updatedAt = new Date();
    this.validate();
  }

  updateDescription(newDescription) {
    if (!newDescription || newDescription.trim().length === 0) {
      throw new Error('Job description cannot be empty');
    }
    this._description = newDescription.trim();
    this._updatedAt = new Date();
  }

  updateLocation(newLocation) {
    this._location = newLocation ? newLocation.trim() : null;
    this._updatedAt = new Date();
  }

  setRemote(isRemote) {
    this._isRemote = !!isRemote;
    this._updatedAt = new Date();
  }

  updateSalaryRange(newSalaryRange) {
    if (!(newSalaryRange instanceof SalaryRange)) {
      throw new Error('Salary range must be a SalaryRange value object');
    }
    this._salaryRange = newSalaryRange;
    this._updatedAt = new Date();
  }

  updateRequirements(newRequirements) {
    if (!(newRequirements instanceof JobRequirements)) {
      throw new Error('Requirements must be a JobRequirements value object');
    }
    this._requirements = newRequirements;
    this._updatedAt = new Date();
  }

  setApplicationDeadline(deadline) {
    if (deadline && !(deadline instanceof Date)) {
      throw new Error('Application deadline must be a Date object');
    }
    this._applicationDeadline = deadline;
    this._updatedAt = new Date();
  }

  addTag(tag) {
    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      throw new Error('Tag must be a non-empty string');
    }

    const trimmedTag = tag.trim();
    if (!this._tags.includes(trimmedTag)) {
      this._tags.push(trimmedTag);
      this._updatedAt = new Date();
    }
  }

  removeTag(tag) {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  publish() {
    if (this._status !== JobStatus.DRAFT) {
      throw new Error('Only draft jobs can be published');
    }
    this._status = JobStatus.PUBLISHED;
    this._postedDate = new Date();
    this._updatedAt = new Date();
  }

  close() {
    if (this._status !== JobStatus.PUBLISHED) {
      throw new Error('Only published jobs can be closed');
    }
    this._status = JobStatus.CLOSED;
    this._updatedAt = new Date();
  }

  pause() {
    if (this._status !== JobStatus.PUBLISHED) {
      throw new Error('Only published jobs can be paused');
    }
    this._status = JobStatus.PAUSED;
    this._updatedAt = new Date();
  }

  resume() {
    if (this._status !== JobStatus.PAUSED) {
      throw new Error('Only paused jobs can be resumed');
    }
    this._status = JobStatus.PUBLISHED;
    this._updatedAt = new Date();
  }

  cancel() {
    if (
      ![JobStatus.DRAFT, JobStatus.PUBLISHED, JobStatus.PAUSED].includes(
        this._status
      )
    ) {
      throw new Error('Job cannot be cancelled in current status');
    }
    this._status = JobStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  isPublished() {
    return this._status === JobStatus.PUBLISHED;
  }

  isClosed() {
    return this._status === JobStatus.CLOSED;
  }

  isExpired() {
    if (!this._applicationDeadline) {
      return false;
    }
    return new Date() > this._applicationDeadline;
  }

  hasTag(tag) {
    return this._tags.includes(tag);
  }

  equals(other) {
    if (!(other instanceof Job)) {
      return false;
    }
    return this._jobId === other._jobId;
  }

  toString() {
    return `${this._title} at ${this._companyId}`;
  }
}

module.exports = Job;
