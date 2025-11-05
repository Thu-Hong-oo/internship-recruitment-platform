// src/domain/recruitment/VerificationStatus.js
class VerificationStatus {
  static PENDING = 'PENDING';
  static UNDER_REVIEW = 'UNDER_REVIEW';
  static VERIFIED = 'VERIFIED';
  static REJECTED = 'REJECTED';
  static SUSPENDED = 'SUSPENDED';

  static values() {
    return [
      this.PENDING,
      this.UNDER_REVIEW,
      this.VERIFIED,
      this.REJECTED,
      this.SUSPENDED,
    ];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = VerificationStatus;
