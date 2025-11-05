// src/domain/recruitment/InvitationStatus.js
class InvitationStatus {
  static PENDING = 'PENDING';
  static ACCEPTED = 'ACCEPTED';
  static REJECTED = 'REJECTED';
  static EXPIRED = 'EXPIRED';

  static values() {
    return [this.PENDING, this.ACCEPTED, this.REJECTED, this.EXPIRED];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = InvitationStatus;
