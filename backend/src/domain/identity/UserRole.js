// src/domain/identity/UserRole.js
class UserRole {
  static CANDIDATE = 'CANDIDATE';
  static EMPLOYER = 'EMPLOYER';
  static ADMIN = 'ADMIN';

  static values() {
    return [this.CANDIDATE, this.EMPLOYER, this.ADMIN];
  }

  static isValid(role) {
    return this.values().includes(role);
  }
}

module.exports = UserRole;
