// src/domain/recruitment/CompanySize.js
class CompanySize {
  static STARTUP = 'STARTUP';
  static SMALL = 'SMALL';
  static MEDIUM = 'MEDIUM';
  static LARGE = 'LARGE';
  static ENTERPRISE = 'ENTERPRISE';

  static values() {
    return [this.STARTUP, this.SMALL, this.MEDIUM, this.LARGE, this.ENTERPRISE];
  }

  static isValid(size) {
    return this.values().includes(size);
  }
}

module.exports = CompanySize;
