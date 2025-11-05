const SkillLevel = require('../enums/SkillLevel');

/**
 * JobSkillRequirement Entity
 * Domain: Master Data
 * Represents a skill requirement for a job posting
 */
class JobSkillRequirement {
  constructor(props) {
    this._jobSkillRequirementId = props.jobSkillRequirementId;
    this._jobId = props.jobId;
    this._skillId = props.skillId;
    this._requiredLevel = props.requiredLevel;
    this._isMandatory =
      props.isMandatory !== undefined ? props.isMandatory : true;
    this._priority = props.priority || 1; // 1 = high, 2 = medium, 3 = low
    this._description = props.description || null;

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._jobId) {
      throw new Error('Job ID is required');
    }

    if (!this._skillId) {
      throw new Error('Skill ID is required');
    }

    if (!Object.values(SkillLevel).includes(this._requiredLevel)) {
      throw new Error('Invalid required skill level');
    }

    if (this._priority < 1 || this._priority > 3) {
      throw new Error('Priority must be between 1 and 3');
    }

    if (this._description && this._description.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }
  }

  // Getters
  get jobSkillRequirementId() {
    return this._jobSkillRequirementId;
  }

  get jobId() {
    return this._jobId;
  }

  get skillId() {
    return this._skillId;
  }

  get requiredLevel() {
    return this._requiredLevel;
  }

  get isMandatory() {
    return this._isMandatory;
  }

  get priority() {
    return this._priority;
  }

  get description() {
    return this._description;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  // Business methods
  updateRequiredLevel(newLevel) {
    if (!Object.values(SkillLevel).includes(newLevel)) {
      throw new Error('Invalid skill level');
    }
    this._requiredLevel = newLevel;
    this._updatedAt = new Date();
  }

  updatePriority(newPriority) {
    if (newPriority < 1 || newPriority > 3) {
      throw new Error('Priority must be between 1 and 3');
    }
    this._priority = newPriority;
    this._updatedAt = new Date();
  }

  updateDescription(newDescription) {
    if (newDescription && newDescription.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }
    this._description = newDescription ? newDescription.trim() : null;
    this._updatedAt = new Date();
  }

  makeMandatory() {
    this._isMandatory = true;
    this._updatedAt = new Date();
  }

  makeOptional() {
    this._isMandatory = false;
    this._updatedAt = new Date();
  }

  isHighPriority() {
    return this._priority === 1;
  }

  isMediumPriority() {
    return this._priority === 2;
  }

  isLowPriority() {
    return this._priority === 3;
  }

  equals(other) {
    if (!(other instanceof JobSkillRequirement)) {
      return false;
    }
    return this._jobSkillRequirementId === other._jobSkillRequirementId;
  }

  toString() {
    return `Job ${this._jobId} requires ${this._requiredLevel} level of skill ${this._skillId}`;
  }
}

module.exports = JobSkillRequirement;
