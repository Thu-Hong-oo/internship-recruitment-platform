/**
 * WorkExperience Entity
 * Domain: Core Recruitment
 * Represents a candidate's work experience
 */
class WorkExperience {
  constructor(props) {
    this._workExperienceId = props.workExperienceId;
    this._jobTitle = props.jobTitle;
    this._companyName = props.companyName;
    this._description = props.description || null;
    this._startDate = props.startDate;
    this._endDate = props.endDate || null;
    this._isCurrentJob = props.isCurrentJob || false;
    this._responsibilities = props.responsibilities || [];

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._workExperienceId) {
      throw new Error('Work experience ID is required');
    }
    if (!this._jobTitle) {
      throw new Error('Job title is required');
    }
    if (!this._companyName) {
      throw new Error('Company name is required');
    }
    if (!this._startDate) {
      throw new Error('Start date is required');
    }
    if (this._endDate && this._startDate > this._endDate) {
      throw new Error('Start date cannot be after end date');
    }
    if (!Array.isArray(this._responsibilities)) {
      throw new Error('Responsibilities must be an array');
    }
  }

  // Getters
  get workExperienceId() {
    return this._workExperienceId;
  }
  get jobTitle() {
    return this._jobTitle;
  }
  get companyName() {
    return this._companyName;
  }
  get description() {
    return this._description;
  }
  get startDate() {
    return this._startDate;
  }
  get endDate() {
    return this._endDate;
  }
  get isCurrentJob() {
    return this._isCurrentJob;
  }
  get responsibilities() {
    return [...this._responsibilities];
  }

  /**
   * Get duration in months
   * @returns {number}
   */
  getDurationInMonths() {
    const endDate = this._endDate || new Date();
    const diffTime = endDate - this._startDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Check if work experience is valid
   * @returns {boolean}
   */
  isValid() {
    return this._startDate && this._jobTitle && this._companyName;
  }

  /**
   * Check if this work experience overlaps with another
   * @param {WorkExperience} other
   * @returns {boolean}
   */
  overlapsWithOther(other) {
    if (!this._endDate || !other._endDate) return false;

    return (
      (this._startDate <= other._endDate &&
        this._endDate >= other._startDate) ||
      (other._startDate <= this._endDate && other._endDate >= this._startDate)
    );
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      workExperienceId: this._workExperienceId,
      jobTitle: this._jobTitle,
      companyName: this._companyName,
      description: this._description,
      startDate: this._startDate,
      endDate: this._endDate,
      isCurrentJob: this._isCurrentJob,
      responsibilities: this._responsibilities,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = WorkExperience;
