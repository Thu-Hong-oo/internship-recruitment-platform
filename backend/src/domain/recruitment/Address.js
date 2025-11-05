// src/domain/recruitment/Address.js
class Address {
  constructor(street, city, state, zipCode, country) {
    this.street = street;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.country = country;
  }

  getFullAddress() {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }

  isValid() {
    return (
      this.street && this.city && this.state && this.zipCode && this.country
    );
  }

  // Value Object equality
  equals(other) {
    if (!(other instanceof Address)) return false;
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.state === other.state &&
      this.zipCode === other.zipCode &&
      this.country === other.country
    );
  }
}

module.exports = Address;
