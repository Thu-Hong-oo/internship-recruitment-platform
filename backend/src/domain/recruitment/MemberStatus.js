// src/domain/recruitment/MemberStatus.js
class MemberStatus {
  static PENDING = 'PENDING';
  static ACTIVE = 'ACTIVE';
  static INACTIVE = 'INACTIVE';
  static SUSPENDED = 'SUSPENDED';

  static values() {
    return [this.PENDING, this.ACTIVE, this.INACTIVE, this.SUSPENDED];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = MemberStatus;
