// src/domain/recruitment/Address.js
// Vietnam address structure: Street, Ward, District, City, Country
/**
 * Address Value Object
 * Immutable, no defaults in constructor
 */
class Address {
  constructor(street, ward, district, city, country) {
    this.street = street;
    this.ward = ward;
    this.district = district;
    this.city = city;
    this.country = country;
  }

  getFullAddress() {
    const parts = [
      this.street,
      this.ward,
      this.district,
      this.city,
      this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  isValid() {
    // At minimum, need city and country
    return !!this.city && !!this.country;
  }

  isComplete() {
    // Full address with all fields
    return (
      !!this.street &&
      !!this.ward &&
      !!this.district &&
      !!this.city &&
      !!this.country
    );
  }

  // Value Object equality
  equals(other) {
    if (!(other instanceof Address)) return false;
    return (
      this.street === other.street &&
      this.ward === other.ward &&
      this.district === other.district &&
      this.city === other.city &&
      this.country === other.country
    );
  }

  /**
   * Convert to plain object for persistence
   * Used by Mapper layer
   */
  toPlainObject() {
    return {
      street: this.street,
      ward: this.ward,
      district: this.district,
      city: this.city,
      country: this.country,
    };
  }
}

module.exports = Address;
