/**
 * ContactInfo Value Object
 * Domain: Master Data
 * Immutable value object representing contact information
 */
class ContactInfo {
  constructor(email, phone, website) {
    if (!email) {
      throw new Error('Email is required for ContactInfo');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    this._email = email.toLowerCase().trim();
    this._phone = phone ? phone.trim() : null;
    this._website = website ? website.trim() : null;

    Object.freeze(this);
  }

  get email() {
    return this._email;
  }

  get phone() {
    return this._phone;
  }

  get website() {
    return this._website;
  }

  hasPhone() {
    return this._phone !== null;
  }

  hasWebsite() {
    return this._website !== null;
  }

  equals(other) {
    if (!(other instanceof ContactInfo)) {
      return false;
    }

    return (
      this._email === other._email &&
      this._phone === other._phone &&
      this._website === other._website
    );
  }

  toString() {
    let contact = this._email;
    if (this._phone) {
      contact += ` | ${this._phone}`;
    }
    if (this._website) {
      contact += ` | ${this._website}`;
    }
    return contact;
  }
}

module.exports = ContactInfo;
