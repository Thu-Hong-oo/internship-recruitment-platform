/**
 * Address Entity
 * Domain: Master Data
 * Represents a physical address location
 */
class Address {
  constructor(props) {
    this._street = props.street || null;
    this._wardName = props.wardName || null;
    this._districtName = props.districtName || null;
    this._provinceName = props.provinceName || null;
    this._wardCode = props.wardCode || null;
    this._districtCode = props.districtCode || null;
    this._provinceCode = props.provinceCode || null;

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    // Address validation - allow partial addresses
    if (this._wardCode && !this._districtCode) {
      throw new Error('District code is required when ward code is provided');
    }
    if (this._districtCode && !this._provinceCode) {
      throw new Error(
        'Province code is required when district code is provided'
      );
    }
  }

  // Getters
  get street() {
    return this._street;
  }
  get wardName() {
    return this._wardName;
  }
  get districtName() {
    return this._districtName;
  }
  get provinceName() {
    return this._provinceName;
  }
  get wardCode() {
    return this._wardCode;
  }
  get districtCode() {
    return this._districtCode;
  }
  get provinceCode() {
    return this._provinceCode;
  }

  /**
   * Get formatted string representation
   * @returns {string}
   */
  getFormattedString() {
    const parts = [];
    if (this._street) parts.push(this._street);
    if (this._wardName) parts.push(this._wardName);
    if (this._districtName) parts.push(this._districtName);
    if (this._provinceName) parts.push(this._provinceName);

    return parts.join(', ');
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      street: this._street,
      wardName: this._wardName,
      districtName: this._districtName,
      provinceName: this._provinceName,
      wardCode: this._wardCode,
      districtCode: this._districtCode,
      provinceCode: this._provinceCode,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = Address;
