// src/domain/recruitment/Application.js
const ApplicationStatus = require('./ApplicationStatus');

/**
 * Application Domain Entity (Aggregate Root)
 * Pure business logic - no defaults, no infrastructure concerns
 * Represents a job application submitted by a candidate
 */
class Application {
  constructor(applicationId, jobId, candidateId) {
    // Required fields only in constructor
    this.applicationId = applicationId;
    this.jobId = jobId;
    this.candidateId = candidateId;

    // Optional fields - no defaults
    this.cvId = null;
    this.coverLetterText = null;
    this.status = null;
    this.appliedAt = null;
    this.viewedAt = null;
    this.employerNotes = null;
    this.candidateNotes = null;
    this.metadata = null;

    // Timestamps
    this.createdAt = null;
    this.updatedAt = null;
  }

  // ==================== STATE TRANSITIONS ====================

  /**
   * Mark application as viewed by employer
   * Business rule: Can only mark unviewed applications
   */
  markAsViewed() {
    if (this.isViewed()) {
      throw new Error('Application has already been viewed');
    }
    this.viewedAt = new Date();
    if (this.status === ApplicationStatus.PENDING) {
      this.status = ApplicationStatus.REVIEWING;
    }
  }

  /**
   * Withdraw application
   * Business rule: Only pending/reviewing applications can be withdrawn
   */
  withdraw() {
    if (!this.canWithdraw()) {
      throw new Error('Cannot withdraw application in current status');
    }
    this.status = ApplicationStatus.WITHDRAWN;
  }

  /**
   * Accept application
   * Business rule: Application must be reviewed
   */
  accept() {
    if (this.status === ApplicationStatus.ACCEPTED) {
      throw new Error('Application is already accepted');
    }
    if (this.status === ApplicationStatus.REJECTED) {
      throw new Error('Cannot accept rejected application');
    }
    this.status = ApplicationStatus.ACCEPTED;
  }

  /**
   * Reject application
   * Business rule: Application must be reviewed, cannot reject accepted
   */
  reject(reason = null) {
    if (this.status === ApplicationStatus.REJECTED) {
      throw new Error('Application is already rejected');
    }
    if (this.status === ApplicationStatus.ACCEPTED) {
      throw new Error('Cannot reject accepted application');
    }
    this.status = ApplicationStatus.REJECTED;
    if (reason) {
      this.employerNotes = reason;
    }
  }

  /**
   * Update status with validation
   */
  updateStatus(newStatus) {
    // Validate status transitions
    if (
      this.status === ApplicationStatus.ACCEPTED &&
      newStatus !== ApplicationStatus.ACCEPTED
    ) {
      throw new Error('Cannot change status from ACCEPTED');
    }

    if (
      this.status === ApplicationStatus.REJECTED &&
      newStatus !== ApplicationStatus.REJECTED
    ) {
      throw new Error('Cannot change status from REJECTED');
    }

    this.status = newStatus;
  }

  // ==================== BUSINESS QUERIES ====================

  /**
   * Check if application can be withdrawn
   */
  canWithdraw() {
    return (
      this.status === ApplicationStatus.PENDING ||
      this.status === ApplicationStatus.REVIEWING
    );
  }

  /**
   * Check if application has been viewed
   */
  isViewed() {
    return !!this.viewedAt;
  }

  /**
   * Check if application is in pending state
   */
  isPending() {
    return this.status === ApplicationStatus.PENDING;
  }

  /**
   * Check if application is accepted
   */
  isAccepted() {
    return this.status === ApplicationStatus.ACCEPTED;
  }

  /**
   * Check if application is rejected
   */
  isRejected() {
    return this.status === ApplicationStatus.REJECTED;
  }

  /**
   * Add employer notes
   */
  addEmployerNotes(notes) {
    this.employerNotes = notes;
  }

  /**
   * Add candidate notes
   */
  addCandidateNotes(notes) {
    this.candidateNotes = notes;
  }
}

module.exports = Application;
