/**
 * Address Value Object
 * Domain: Master Data
 * Immutable value object representing a physical address
 */
class Address {
  constructor(street, city, state, country, postalCode) {
    if (!street || !city || !country) {
      throw new Error('Street, city, and country are required for Address');
    }

    this._street = street;
    this._city = city;
    this._state = state;
    this._country = country;
    this._postalCode = postalCode;

    Object.freeze(this);
  }

  get street() {
    return this._street;
  }

  get city() {
    return this._city;
  }

  get state() {
    return this._state;
  }

  get country() {
    return this._country;
  }

  get postalCode() {
    return this._postalCode;
  }

  get fullAddress() {
    return `${this._street}, ${this._city}${
      this._state ? ', ' + this._state : ''
    }, ${this._country}${this._postalCode ? ' ' + this._postalCode : ''}`;
  }

  equals(other) {
    if (!(other instanceof Address)) {
      return false;
    }

    return (
      this._street === other._street &&
      this._city === other._city &&
      this._state === other._state &&
      this._country === other._country &&
      this._postalCode === other._postalCode
    );
  }

  toString() {
    return this.fullAddress;
  }
}

module.exports = Address;
