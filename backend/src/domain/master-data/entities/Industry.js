/**
 * Industry Entity
 * Domain: Master Data
 * Represents an industry sector
 */
class Industry {
  constructor(props) {
    this._industryId = props.industryId;
    this._slug = props.slug;
    this._industryName = props.industryName;
    this._path = props.path || null;
    this._level = props.level || 1;

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._industryId) {
      throw new Error('Industry ID is required');
    }
    if (!this._slug) {
      throw new Error('Industry slug is required');
    }
    if (!this._industryName) {
      throw new Error('Industry name is required');
    }
    if (this._level < 1) {
      throw new Error('Level must be at least 1');
    }
  }

  // Getters
  get industryId() {
    return this._industryId;
  }
  get slug() {
    return this._slug;
  }
  get industryName() {
    return this._industryName;
  }
  get path() {
    return this._path;
  }
  get level() {
    return this._level;
  }

  /**
   * Get full hierarchy path
   * @returns {Industry[]}
   */
  getFullHierarchy() {
    // This would return the full hierarchy path
    return [];
  }

  /**
   * Check if this is a leaf node
   * @returns {boolean}
   */
  isLeafNode() {
    // This would check if this industry has no children
    return true;
  }

  /**
   * Get all descendants
   * @returns {Industry[]}
   */
  getAllDescendants() {
    // This would return all descendant industries
    return [];
  }

  /**
   * Check if this industry is ancestor of another
   * @param {Industry} other
   * @returns {boolean}
   */
  isAncestorOf(other) {
    // This would check if this industry is ancestor of other
    return false;
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      industryId: this._industryId,
      slug: this._slug,
      industryName: this._industryName,
      path: this._path,
      level: this._level,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = Industry;
