/**
 * FieldOfStudy Entity
 * Domain: Master Data
 * Represents an academic field of study
 */
class FieldOfStudy {
  constructor(props) {
    this._fieldOfStudyId = props.fieldOfStudyId;
    this._name = props.name;
    this._description = props.description || null;
    this._parentFieldId = props.parentFieldId || null;
    this._category = props.category || null;
    this._isActive = props.isActive !== undefined ? props.isActive : true;

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Field of study name is required');
    }

    if (this._name.length > 200) {
      throw new Error('Field of study name cannot exceed 200 characters');
    }

    if (this._description && this._description.length > 500) {
      throw new Error(
        'Field of study description cannot exceed 500 characters'
      );
    }

    if (this._category && this._category.length > 100) {
      throw new Error('Field of study category cannot exceed 100 characters');
    }
  }

  // Getters
  get fieldOfStudyId() {
    return this._fieldOfStudyId;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get parentFieldId() {
    return this._parentFieldId;
  }

  get category() {
    return this._category;
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
      throw new Error('Field of study name cannot be empty');
    }
    this._name = newName.trim();
    this._updatedAt = new Date();
    this.validate();
  }

  updateDescription(newDescription) {
    if (newDescription && newDescription.length > 500) {
      throw new Error(
        'Field of study description cannot exceed 500 characters'
      );
    }
    this._description = newDescription ? newDescription.trim() : null;
    this._updatedAt = new Date();
  }

  updateCategory(newCategory) {
    if (newCategory && newCategory.length > 100) {
      throw new Error('Field of study category cannot exceed 100 characters');
    }
    this._category = newCategory ? newCategory.trim() : null;
    this._updatedAt = new Date();
  }

  setParentField(parentFieldId) {
    this._parentFieldId = parentFieldId;
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

  isSubField() {
    return this._parentFieldId !== null;
  }

  equals(other) {
    if (!(other instanceof FieldOfStudy)) {
      return false;
    }
    return this._fieldOfStudyId === other._fieldOfStudyId;
  }

  toString() {
    return this._name;
  }
}

module.exports = FieldOfStudy;
