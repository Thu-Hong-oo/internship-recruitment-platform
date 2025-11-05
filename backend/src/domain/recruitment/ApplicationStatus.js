// src/domain/recruitment/ApplicationStatus.js
class ApplicationStatus {
  static SUBMITTED = 'SUBMITTED';
  static REVIEWING = 'REVIEWING';
  static ACCEPTED = 'ACCEPTED';
  static REJECTED = 'REJECTED';
  static WITHDRAWN = 'WITHDRAWN';

  static values() {
    return [
      this.SUBMITTED,
      this.REVIEWING,
      this.ACCEPTED,
      this.REJECTED,
      this.WITHDRAWN,
    ];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = ApplicationStatus;
