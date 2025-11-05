const User = require('./User');

/**
 * Candidate Entity
 * Domain: Identity
 * Represents a job seeker in the system
 */
class Candidate extends User {
  constructor(props) {
    super(props);

    // Protected properties (entity properties)
    this._headline = props.headline || null;
    this._bio = props.bio || null;
    this._portfolioUrl = props.portfolioUrl || null;
    this._linkedInUrl = props.linkedInUrl || null;
    this._desiredLocationCodes = props.desiredLocationCodes || [];
    this._defaultCvFileId = props.defaultCvFileId || null;
    this._profileCompleteness = props.profileCompleteness || 0;
    this._isOpenToWork =
      props.isOpenToWork !== undefined ? props.isOpenToWork : true;

    this.validateCandidate();
  }

  validateCandidate() {
    super.validate();

    if (this._profileCompleteness < 0 || this._profileCompleteness > 100) {
      throw new Error('Profile completeness must be between 0 and 100');
    }
    if (!Array.isArray(this._desiredLocationCodes)) {
      throw new Error('Desired location codes must be an array');
    }
  }

  // Getters for protected properties
  get headline() {
    return this._headline;
  }
  get bio() {
    return this._bio;
  }
  get portfolioUrl() {
    return this._portfolioUrl;
  }
  get linkedInUrl() {
    return this._linkedInUrl;
  }
  get desiredLocationCodes() {
    return [...this._desiredLocationCodes];
  }
  get defaultCvFileId() {
    return this._defaultCvFileId;
  }
  get profileCompleteness() {
    return this._profileCompleteness;
  }
  get isOpenToWork() {
    return this._isOpenToWork;
  }

  /**
   * Update candidate profile information
   * @param {string} headline
   * @param {string} bio
   * @param {string} portfolioUrl
   * @param {string} linkedInUrl
   */
  updateCandidateProfile(headline, bio, portfolioUrl, linkedInUrl) {
    if (headline !== undefined) {
      this._headline = headline;
    }
    if (bio !== undefined) {
      this._bio = bio;
    }
    if (portfolioUrl !== undefined) {
      this._portfolioUrl = portfolioUrl;
    }
    if (linkedInUrl !== undefined) {
      this._linkedInUrl = linkedInUrl;
    }
    this._updatedAt = new Date();
    this.calculateProfileCompleteness();
  }

  /**
   * Calculate profile completeness percentage
   * @returns {number}
   */
  calculateProfileCompleteness() {
    let completeness = 0;
    const fields = [
      this._headline,
      this._bio,
      this._portfolioUrl,
      this._linkedInUrl,
      this._defaultCvFileId,
    ];

    const filledFields = fields.filter(field => field && field.trim()).length;
    completeness = Math.round((filledFields / fields.length) * 100);

    this._profileCompleteness = completeness;
    return completeness;
  }

  /**
   * Set open to work status
   * @param {boolean} status
   */
  setIsOpenToWork(status) {
    this._isOpenToWork = Boolean(status);
    this._updatedAt = new Date();
  }

  /**
   * Add work experience
   * @param {Object} data - Work experience data
   * @returns {WorkExperience}
   */
  addWorkExperience(data) {
    // This would typically create a WorkExperience entity
    // For now, return a placeholder
    const WorkExperience = require('../../recruitment/entities/WorkExperience');
    return new WorkExperience({
      candidateId: this._userId,
      ...data,
    });
  }

  /**
   * Add education
   * @param {Object} data - Education data
   * @returns {Education}
   */
  addEducation(data) {
    // This would typically create an Education entity
    const Education = require('../../recruitment/entities/Education');
    return new Education({
      candidateId: this._userId,
      ...data,
    });
  }

  /**
   * Add skill
   * @param {string} skill
   * @param {string} level
   * @param {number} years
   * @returns {CandidateSkill}
   */
  addSkill(skill, level, years) {
    // This would typically create a CandidateSkill entity
    const CandidateSkill = require('../../master-data/entities/CandidateSkill');
    return new CandidateSkill({
      candidateId: this._userId,
      skillName: skill,
      level: level,
      yearsOfExperience: years,
    });
  }

  /**
   * Upload CV file
   * @param {Object} fileInfo - File information
   * @returns {CVFile}
   */
  uploadCV(fileInfo) {
    // This would typically create a CVFile entity
    const CVFile = require('../../nlp-parsing/entities/CVFile');
    return new CVFile({
      candidateId: this._userId,
      ...fileInfo,
    });
  }

  /**
   * Set default CV file
   * @param {string} cvFileId
   */
  setDefaultCV(cvFileId) {
    this._defaultCvFileId = cvFileId;
    this._updatedAt = new Date();
  }

  /**
   * Save a job
   * @param {JobPosting} job
   * @returns {SavedJob}
   */
  saveJob(job) {
    const SavedJob = require('../../supporting/entities/SavedJob');
    return new SavedJob({
      candidateId: this._userId,
      jobId: job.jobId,
    });
  }

  /**
   * Unsave a job
   * @param {string} savedJobId
   */
  unsaveJob(savedJobId) {
    // This would typically remove the SavedJob entity
    // For now, just return true
    return true;
  }

  /**
   * Follow a company
   * @param {Company} company
   * @returns {FollowedCompany}
   */
  followCompany(company) {
    const FollowedCompany = require('../../supporting/entities/FollowedCompany');
    return new FollowedCompany({
      candidateId: this._userId,
      companyId: company.companyId,
      notifyNewJobs: true,
    });
  }

  /**
   * Unfollow a company
   * @param {string} followedCompanyId
   */
  unfollowCompany(followedCompanyId) {
    // This would typically remove the FollowedCompany entity
    return true;
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      headline: this._headline,
      bio: this._bio,
      portfolioUrl: this._portfolioUrl,
      linkedInUrl: this._linkedInUrl,
      desiredLocationCodes: this._desiredLocationCodes,
      defaultCvFileId: this._defaultCvFileId,
      profileCompleteness: this._profileCompleteness,
      isOpenToWork: this._isOpenToWork,
    };
  }
}

module.exports = Candidate;
