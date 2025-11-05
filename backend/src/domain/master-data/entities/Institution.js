const InstitutionType = require('../enums/InstitutionType');
const Address = require('../value-objects/Address');
const ContactInfo = require('../value-objects/ContactInfo');

/**
 * Institution Entity
 * Domain: Master Data
 * Represents an educational institution
 */
class Institution {
  constructor(props) {
    this._institutionId = props.institutionId;
    this._name = props.name;
    this._type = props.type;
    this._address = props.address; // Address value object
    this._contactInfo = props.contactInfo; // ContactInfo value object
    this._website = props.website || null;
    this._accreditation = props.accreditation || null;
    this._isActive = props.isActive !== undefined ? props.isActive : true;

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Institution name is required');
    }

    if (this._name.length > 200) {
      throw new Error('Institution name cannot exceed 200 characters');
    }

    if (!Object.values(InstitutionType).includes(this._type)) {
      throw new Error('Invalid institution type');
    }

    if (!(this._address instanceof Address)) {
      throw new Error('Address must be an Address value object');
    }

    if (!(this._contactInfo instanceof ContactInfo)) {
      throw new Error('ContactInfo must be a ContactInfo value object');
    }

    if (this._website && this._website.length > 500) {
      throw new Error('Website URL cannot exceed 500 characters');
    }

    if (this._accreditation && this._accreditation.length > 200) {
      throw new Error('Accreditation cannot exceed 200 characters');
    }
  }

  // Getters
  get institutionId() {
    return this._institutionId;
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }

  get address() {
    return this._address;
  }

  get contactInfo() {
    return this._contactInfo;
  }

  get website() {
    return this._website;
  }

  get accreditation() {
    return this._accreditation;
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
      throw new Error('Institution name cannot be empty');
    }
    this._name = newName.trim();
    this._updatedAt = new Date();
    this.validate();
  }

  updateAddress(newAddress) {
    if (!(newAddress instanceof Address)) {
      throw new Error('Address must be an Address value object');
    }
    this._address = newAddress;
    this._updatedAt = new Date();
  }

  updateContactInfo(newContactInfo) {
    if (!(newContactInfo instanceof ContactInfo)) {
      throw new Error('ContactInfo must be a ContactInfo value object');
    }
    this._contactInfo = newContactInfo;
    this._updatedAt = new Date();
  }

  updateWebsite(newWebsite) {
    if (newWebsite && newWebsite.length > 500) {
      throw new Error('Website URL cannot exceed 500 characters');
    }
    this._website = newWebsite ? newWebsite.trim() : null;
    this._updatedAt = new Date();
  }

  updateAccreditation(newAccreditation) {
    if (newAccreditation && newAccreditation.length > 200) {
      throw new Error('Accreditation cannot exceed 200 characters');
    }
    this._accreditation = newAccreditation ? newAccreditation.trim() : null;
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

  equals(other) {
    if (!(other instanceof Institution)) {
      return false;
    }
    return this._institutionId === other._institutionId;
  }

  toString() {
    return `${this._name} (${this._type})`;
  }
}

module.exports = Institution;
