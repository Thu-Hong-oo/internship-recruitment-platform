// src/domain/recruitment/JobStatus.js
class JobStatus {
  static DRAFT = 'draft';
  static PUBLISHED = 'published';
  static CLOSED = 'closed';

  static values() {
    return [this.DRAFT, this.PUBLISHED, this.CLOSED];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = JobStatus;
