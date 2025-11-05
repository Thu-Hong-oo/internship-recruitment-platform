const User = require('./User');

/**
 * Employer Entity
 * Domain: Identity
 * Represents a company representative posting jobs in the system
 */
class Employer extends User {
  constructor(props) {
    super(props);

    // Protected properties (entity properties)
    this._jobTitle = props.jobTitle || null;
    this._companyId = props.companyId || null; // Reference to company entity

    this.validateEmployer();
  }

  validateEmployer() {
    super.validate();

    if (this._jobTitle && this._jobTitle.length > 100) {
      throw new Error('Job title cannot exceed 100 characters');
    }
  }

  // Getters for protected properties
  get jobTitle() {
    return this._jobTitle;
  }
  get companyId() {
    return this._companyId;
  }

  /**
   * Update employer profile information
   * @param {Object} profileData - Profile data to update
   */
  updateProfile(profileData) {
    super.updateProfile(profileData.fullName, profileData.avatarUrl);

    if (profileData.jobTitle !== undefined) {
      this._jobTitle = profileData.jobTitle;
    }
    if (profileData.companyId !== undefined) {
      this._companyId = profileData.companyId;
    }

    this.validateEmployer();
  }

  /**
   * Check if employer can post a job
   * @returns {boolean}
   */
  canPostJob() {
    return this.isActive() && this._companyId !== null;
  }

  /**
   * Check if employer can manage company
   * @returns {boolean}
   */
  canManageCompany() {
    return this.isActive() && this._companyId !== null;
  }

  /**
   * Check if profile is complete
   * @returns {boolean}
   */
  isProfileComplete() {
    return !!this._jobTitle;
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      jobTitle: this._jobTitle,
      companyId: this._companyId,
    };
  }
}

module.exports = Employer;
