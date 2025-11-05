const DegreeLevel = require('../enums/DegreeLevel');

/**
 * Degree Entity
 * Domain: Master Data
 * Represents an academic degree
 */
class Degree {
  constructor(props) {
    this._degreeId = props.degreeId;
    this._name = props.name;
    this._level = props.level;
    this._description = props.description || null;
    this._fieldOfStudyId = props.fieldOfStudyId || null;
    this._institutionId = props.institutionId || null;
    this._isActive = props.isActive !== undefined ? props.isActive : true;

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Degree name is required');
    }

    if (this._name.length > 200) {
      throw new Error('Degree name cannot exceed 200 characters');
    }

    if (!Object.values(DegreeLevel).includes(this._level)) {
      throw new Error('Invalid degree level');
    }

    if (this._description && this._description.length > 500) {
      throw new Error('Degree description cannot exceed 500 characters');
    }
  }

  // Getters
  get degreeId() {
    return this._degreeId;
  }

  get name() {
    return this._name;
  }

  get level() {
    return this._level;
  }

  get description() {
    return this._description;
  }

  get fieldOfStudyId() {
    return this._fieldOfStudyId;
  }

  get institutionId() {
    return this._institutionId;
  }

  get isActive() {
    return this._isActive;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  // Business methods
  updateName(newName) {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Degree name cannot be empty');
    }
    this._name = newName.trim();
    this._updatedAt = new Date();
    this.validate();
  }

  updateDescription(newDescription) {
    if (newDescription && newDescription.length > 500) {
      throw new Error('Degree description cannot exceed 500 characters');
    }
    this._description = newDescription ? newDescription.trim() : null;
    this._updatedAt = new Date();
  }

  setFieldOfStudy(fieldOfStudyId) {
    this._fieldOfStudyId = fieldOfStudyId;
    this._updatedAt = new Date();
  }

  setInstitution(institutionId) {
    this._institutionId = institutionId;
    this._updatedAt = new Date();
  }

  deactivate() {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate() {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  isHigherEducation() {
    return [
      DegreeLevel.BACHELOR,
      DegreeLevel.MASTER,
      DegreeLevel.DOCTORATE,
    ].includes(this._level);
  }

  equals(other) {
    if (!(other instanceof Degree)) {
      return false;
    }
    return this._degreeId === other._degreeId;
  }

  toString() {
    return `${this._name} (${this._level})`;
  }
}

module.exports = Degree;
