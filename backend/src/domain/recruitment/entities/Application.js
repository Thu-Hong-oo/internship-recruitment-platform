const ApplicationStatus = require('../enums/ApplicationStatus');

/**
 * Application Entity
 * Domain: Recruitment
 * Represents a job application submitted by a candidate
 */
class Application {
  constructor(props) {
    this._applicationId = props.applicationId;
    this._jobId = props.jobId;
    this._candidateId = props.candidateId;
    this._status = props.status || ApplicationStatus.PENDING;
    this._appliedDate = props.appliedDate || new Date();
    this._coverLetter = props.coverLetter || null;
    this._resumeUrl = props.resumeUrl || null;
    this._notes = props.notes || null;

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  // Getters
  get applicationId() {
    return this._applicationId;
  }
  get jobId() {
    return this._jobId;
  }
  get candidateId() {
    return this._candidateId;
  }
  get status() {
    return this._status;
  }
  get appliedDate() {
    return this._appliedDate;
  }
  get coverLetter() {
    return this._coverLetter;
  }
  get resumeUrl() {
    return this._resumeUrl;
  }
  get notes() {
    return this._notes;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  validate() {
    if (!this._jobId) {
      throw new Error('Job ID is required');
    }

    if (!this._candidateId) {
      throw new Error('Candidate ID is required');
    }

    if (!Object.values(ApplicationStatus).includes(this._status)) {
      throw new Error('Invalid application status');
    }

    if (this._coverLetter && this._coverLetter.length > 2000) {
      throw new Error('Cover letter cannot exceed 2000 characters');
    }

    if (this._notes && this._notes.length > 1000) {
      throw new Error('Notes cannot exceed 1000 characters');
    }
  }

  // Business methods
  updateStatus(newStatus) {
    if (!Object.values(ApplicationStatus).includes(newStatus)) {
      throw new Error('Invalid application status');
    }

    if (
      this._status === ApplicationStatus.ACCEPTED &&
      newStatus !== ApplicationStatus.ACCEPTED
    ) {
      throw new Error('Cannot change status from ACCEPTED');
    }

    if (
      this._status === ApplicationStatus.REJECTED &&
      newStatus !== ApplicationStatus.REJECTED
    ) {
      throw new Error('Cannot change status from REJECTED');
    }

    this._status = newStatus;
    this._updatedAt = new Date();
  }

  updateNotes(notes) {
    if (notes && notes.length > 1000) {
      throw new Error('Notes cannot exceed 1000 characters');
    }

    this._notes = notes;
    this._updatedAt = new Date();
  }

  withdraw() {
    if (this._status === ApplicationStatus.ACCEPTED) {
      throw new Error('Cannot withdraw an accepted application');
    }

    this._status = ApplicationStatus.WITHDRAWN;
    this._updatedAt = new Date();
  }

  // Static factory methods
  static create(props) {
    return new Application({
      ...props,
      applicationId: props.applicationId || this.generateId(),
      appliedDate: new Date(),
    });
  }

  static generateId() {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Serialization
  toJSON() {
    return {
      applicationId: this._applicationId,
      jobId: this._jobId,
      candidateId: this._candidateId,
      status: this._status,
      appliedDate: this._appliedDate,
      coverLetter: this._coverLetter,
      resumeUrl: this._resumeUrl,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = Application;
