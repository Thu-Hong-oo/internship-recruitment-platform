// src/domain/recruitment/JobStatus.js
class JobStatus {
  static DRAFT = 'DRAFT';
  static PUBLISHED = 'PUBLISHED';
  static CLOSED = 'CLOSED';

  static values() {
    return [this.DRAFT, this.PUBLISHED, this.CLOSED];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = JobStatus;
