const SkillLevel = require('../enums/SkillLevel');

/**
 * CandidateSkill Entity
 * Domain: Master Data
 * Represents a skill possessed by a candidate
 */
class CandidateSkill {
  constructor(props) {
    this._candidateSkillId = props.candidateSkillId;
    this._candidateId = props.candidateId;
    this._skillId = props.skillId;
    this._proficiencyLevel = props.proficiencyLevel;
    this._yearsOfExperience = props.yearsOfExperience || 0;
    this._isVerified =
      props.isVerified !== undefined ? props.isVerified : false;
    this._certifications = props.certifications || []; // Array of certification names
    this._lastUsedDate = props.lastUsedDate || null;

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._candidateId) {
      throw new Error('Candidate ID is required');
    }

    if (!this._skillId) {
      throw new Error('Skill ID is required');
    }

    if (!Object.values(SkillLevel).includes(this._proficiencyLevel)) {
      throw new Error('Invalid proficiency level');
    }

    if (this._yearsOfExperience < 0 || this._yearsOfExperience > 50) {
      throw new Error('Years of experience must be between 0 and 50');
    }

    if (!Array.isArray(this._certifications)) {
      throw new Error('Certifications must be an array');
    }

    if (
      this._certifications.some(
        cert => typeof cert !== 'string' || cert.length > 200
      )
    ) {
      throw new Error(
        'Each certification name must be a string with max 200 characters'
      );
    }
  }

  // Getters
  get candidateSkillId() {
    return this._candidateSkillId;
  }

  get candidateId() {
    return this._candidateId;
  }

  get skillId() {
    return this._skillId;
  }

  get proficiencyLevel() {
    return this._proficiencyLevel;
  }

  get yearsOfExperience() {
    return this._yearsOfExperience;
  }

  get isVerified() {
    return this._isVerified;
  }

  get certifications() {
    return [...this._certifications]; // Return copy to prevent external mutation
  }

  get lastUsedDate() {
    return this._lastUsedDate;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  // Business methods
  updateProficiencyLevel(newLevel) {
    if (!Object.values(SkillLevel).includes(newLevel)) {
      throw new Error('Invalid proficiency level');
    }
    this._proficiencyLevel = newLevel;
    this._updatedAt = new Date();
  }

  updateYearsOfExperience(years) {
    if (years < 0 || years > 50) {
      throw new Error('Years of experience must be between 0 and 50');
    }
    this._yearsOfExperience = years;
    this._updatedAt = new Date();
  }

  verify() {
    this._isVerified = true;
    this._updatedAt = new Date();
  }

  unverify() {
    this._isVerified = false;
    this._updatedAt = new Date();
  }

  addCertification(certification) {
    if (
      !certification ||
      typeof certification !== 'string' ||
      certification.length > 200
    ) {
      throw new Error(
        'Certification name must be a non-empty string with max 200 characters'
      );
    }

    if (!this._certifications.includes(certification.trim())) {
      this._certifications.push(certification.trim());
      this._updatedAt = new Date();
    }
  }

  removeCertification(certification) {
    const index = this._certifications.indexOf(certification);
    if (index > -1) {
      this._certifications.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  updateLastUsedDate(date) {
    this._lastUsedDate = date;
    this._updatedAt = new Date();
  }

  hasCertification(certification) {
    return this._certifications.includes(certification);
  }

  isBeginner() {
    return this._proficiencyLevel === SkillLevel.BEGINNER;
  }

  isIntermediate() {
    return this._proficiencyLevel === SkillLevel.INTERMEDIATE;
  }

  isAdvanced() {
    return this._proficiencyLevel === SkillLevel.ADVANCED;
  }

  isExpert() {
    return this._proficiencyLevel === SkillLevel.EXPERT;
  }

  equals(other) {
    if (!(other instanceof CandidateSkill)) {
      return false;
    }
    return this._candidateSkillId === other._candidateSkillId;
  }

  toString() {
    return `Candidate ${this._candidateId} has ${this._proficiencyLevel} level of skill ${this._skillId}`;
  }
}

module.exports = CandidateSkill;
