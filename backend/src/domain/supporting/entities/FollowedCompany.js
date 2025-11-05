/**
 * FollowedCompany Entity
 * Domain: Supporting
 * Represents a company followed by a candidate
 */
class FollowedCompany {
  constructor(props) {
    this._followedCompanyId = props.followedCompanyId;
    this._candidateId = props.candidateId;
    this._companyId = props.companyId;
    this._notifyNewJobs = props.notifyNewJobs !== undefined ? props.notifyNewJobs : true;

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._candidateId) {
      throw new Error('Candidate ID is required');
    }
    if (!this._companyId) {
      throw new Error('Company ID is required');
    }
  }

  // Getters
  get followedCompanyId() { return this._followedCompanyId; }
  get candidateId() { return this._candidateId; }
  get companyId() { return this._companyId; }
  get notifyNewJobs() { return this._notifyNewJobs; }

  // Business methods
  toggleNotifications(enabled) {
    this._notifyNewJobs = Boolean(enabled);
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      followedCompanyId: this._followedCompanyId,
      candidateId: this._candidateId,
      companyId: this._companyId,
      notifyNewJobs: this._notifyNewJobs,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}

module.exports = FollowedCompany;
