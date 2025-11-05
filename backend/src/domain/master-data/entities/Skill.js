const SkillLevel = require('../enums/SkillLevel');

/**
 * Skill Entity
 * Domain: Master Data
 * Represents a skill in the system
 */
class Skill {
  constructor(props) {
    this._skillId = props.skillId;
    this._slug = props.slug;
    this._skillName = props.skillName;
    this._description = props.description || null;
    this._aliases = props.aliases || [];
    this._path = props.path || null;
    this._level = props.level || 1;

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._skillId) {
      throw new Error('Skill ID is required');
    }
    if (!this._slug) {
      throw new Error('Skill slug is required');
    }
    if (!this._skillName) {
      throw new Error('Skill name is required');
    }
    if (!Array.isArray(this._aliases)) {
      throw new Error('Aliases must be an array');
    }
    if (this._level < 1) {
      throw new Error('Level must be at least 1');
    }
  }

  // Getters
  get skillId() {
    return this._skillId;
  }
  get slug() {
    return this._slug;
  }
  get skillName() {
    return this._skillName;
  }
  get description() {
    return this._description;
  }
  get aliases() {
    return [...this._aliases];
  }
  get path() {
    return this._path;
  }
  get level() {
    return this._level;
  }

  /**
   * Check if search term matches any alias
   * @param {string} searchTerm
   * @returns {boolean}
   */
  matchesAlias(searchTerm) {
    return this._aliases.some(alias =>
      alias.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Get full hierarchy path
   * @returns {Skill[]}
   */
  getFullHierarchy() {
    // This would return the full hierarchy path
    return [];
  }

  /**
   * Get all descendants
   * @returns {Skill[]}
   */
  getAllDescendants() {
    // This would return all descendant skills
    return [];
  }

  /**
   * Check if this skill is ancestor of another
   * @param {Skill} other
   * @returns {boolean}
   */
  isAncestorOf(other) {
    // This would check if this skill is ancestor of other
    return false;
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      skillId: this._skillId,
      slug: this._slug,
      skillName: this._skillName,
      description: this._description,
      aliases: this._aliases,
      path: this._path,
      level: this._level,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = Skill;
