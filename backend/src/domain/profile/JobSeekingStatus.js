// src/domain/profile/JobSeekingStatus.js
class JobSeekingStatus {
  static ACTIVE = 'ACTIVE';
  static INACTIVE = 'INACTIVE';

  static values() {
    return [this.ACTIVE, this.INACTIVE];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = JobSeekingStatus;
