// src/domain/recruitment/JobApplication.js
const ApplicationStatus = require('./ApplicationStatus');

class JobApplication {
  constructor(applicationId, jobId, candidateId) {
    this.applicationId = applicationId;
    this.jobId = jobId;
    this.candidateId = candidateId;
    this.status = ApplicationStatus.SUBMITTED;
    this.appliedAt = new Date();
    this.coverLetter = '';
  }

  submit() {
    this.status = ApplicationStatus.SUBMITTED;
  }

  withdraw() {
    this.status = ApplicationStatus.WITHDRAWN;
  }

  updateStatus(newStatus) {
    if (!ApplicationStatus.isValid(newStatus)) {
      throw new Error('Invalid application status');
    }
    this.status = newStatus;
  }

  isActive() {
    return [ApplicationStatus.SUBMITTED, ApplicationStatus.REVIEWING].includes(
      this.status
    );
  }
}

module.exports = JobApplication;
