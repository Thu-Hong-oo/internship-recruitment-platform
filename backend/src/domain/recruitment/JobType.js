// src/domain/recruitment/JobType.js
class JobType {
  static FULL_TIME = 'FULL_TIME';
  static PART_TIME = 'PART_TIME';
  static CONTRACT = 'CONTRACT';
  static INTERNSHIP = 'INTERNSHIP';

  static values() {
    return [this.FULL_TIME, this.PART_TIME, this.CONTRACT, this.INTERNSHIP];
  }

  static isValid(type) {
    return this.values().includes(type);
  }
}

module.exports = JobType;
