// src/domain/identity/UserStatus.js
class UserStatus {
  static ACTIVE = 'ACTIVE';
  static SUSPENDED = 'SUSPENDED';

  static values() {
    return [this.ACTIVE, this.SUSPENDED];
  }

  static isValid(status) {
    return this.values().includes(status);
  }
}

module.exports = UserStatus;
