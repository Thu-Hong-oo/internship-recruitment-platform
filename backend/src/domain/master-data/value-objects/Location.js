/**
 * Location Value Object
 * Domain: Master Data
 * Immutable value object representing geographical coordinates
 */
class Location {
  constructor(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    this._latitude = latitude;
    this._longitude = longitude;

    Object.freeze(this);
  }

  get latitude() {
    return this._latitude;
  }

  get longitude() {
    return this._longitude;
  }

  get coordinates() {
    return [this._longitude, this._latitude]; // GeoJSON format [lng, lat]
  }

  distanceTo(otherLocation) {
    if (!(otherLocation instanceof Location)) {
      throw new Error('Argument must be a Location instance');
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this._toRadians(otherLocation.latitude - this._latitude);
    const dLon = this._toRadians(otherLocation.longitude - this._longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRadians(this._latitude)) *
        Math.cos(this._toRadians(otherLocation.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Distance in kilometers
  }

  equals(other) {
    if (!(other instanceof Location)) {
      return false;
    }

    return (
      Math.abs(this._latitude - other._latitude) < 0.000001 &&
      Math.abs(this._longitude - other._longitude) < 0.000001
    );
  }

  toString() {
    return `${this._latitude}, ${this._longitude}`;
  }

  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = Location;
