// src/domain/recruitment/value-objects/JobRequirements.js
class JobRequirements {
  constructor(props) {
    this._requiredSkills = props.requiredSkills || [];
    this._experienceYears = props.experienceYears || 0;
    this._educationLevel = props.educationLevel || '';
    this._certifications = props.certifications || [];
    this._languages = props.languages || [];
    this._location = props.location || '';
    this._salaryRange = props.salaryRange || null;
  }

  get requiredSkills() {
    return [...this._requiredSkills];
  }

  get experienceYears() {
    return this._experienceYears;
  }

  get educationLevel() {
    return this._educationLevel;
  }

  get certifications() {
    return [...this._certifications];
  }

  get languages() {
    return [...this._languages];
  }

  get location() {
    return this._location;
  }

  get salaryRange() {
    return this._salaryRange;
  }

  hasSkill(skill) {
    return this._requiredSkills.includes(skill);
  }

  requiresExperience(years) {
    return this._experienceYears <= years;
  }

  toString() {
    return `JobRequirements: ${this._requiredSkills.join(', ')}`;
  }
}

module.exports = JobRequirements;
