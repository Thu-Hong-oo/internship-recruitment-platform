/**
 * Skill Domain Entity
 *
 * Represents a skill in the recruitment system (e.g., "JavaScript", "Project Management").
 * Supports hierarchical structure with parent-child relationships.
 *
 * Following Clean Architecture principles:
 * - No dependencies on infrastructure layer
 * - Business logic encapsulated within entity
 * - Constructor accepts only required fields
 * - Optional fields set to null (not undefined)
 * - No default values in constructor
 */
class Skill {
  constructor(
    skillId,
    name,
    slug,
    description = null,
    parentId = null,
    embedding = null,
    popularity = 0,
    isActive = true,
    demandLevel = 'medium',
    trend = 'stable',
    relatedSkills = null,
    createdAt = null,
    updatedAt = null
  ) {
    // Required fields
    this.skillId = skillId;
    this.name = name;
    this.slug = slug;

    // Optional fields
    this.description = description;
    this.parentId = parentId; // For hierarchical skills
    this.embedding = embedding; // AI embedding vector

    // Metadata
    this.popularity = popularity;
    this.isActive = isActive;
    this.demandLevel = demandLevel; // low, medium, high, critical
    this.trend = trend; // declining, stable, growing, emerging

    // Related skills
    this.relatedSkills = relatedSkills; // Array of skill IDs

    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validates the skill entity
   * @throws {Error} if validation fails
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Skill name is required');
    }

    if (this.name.length > 100) {
      throw new Error('Skill name cannot exceed 100 characters');
    }

    if (!this.slug || this.slug.trim().length === 0) {
      throw new Error('Skill slug is required');
    }

    const validDemandLevels = ['low', 'medium', 'high', 'critical'];
    if (!validDemandLevels.includes(this.demandLevel)) {
      throw new Error(`Invalid demand level: ${this.demandLevel}`);
    }

    const validTrends = ['declining', 'stable', 'growing', 'emerging'];
    if (!validTrends.includes(this.trend)) {
      throw new Error(`Invalid trend: ${this.trend}`);
    }
  }

  /**
   * Activates the skill
   */
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivates the skill
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Increases skill popularity
   * @param {number} amount - Amount to increase
   */
  increasePopularity(amount = 1) {
    this.popularity += amount;
    this.updatedAt = new Date();
  }

  /**
   * Sets skill demand level
   * @param {string} level - Demand level (low, medium, high, critical)
   */
  setDemandLevel(level) {
    const validLevels = ['low', 'medium', 'high', 'critical'];
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid demand level: ${level}`);
    }
    this.demandLevel = level;
    this.updatedAt = new Date();
  }

  /**
   * Sets skill trend
   * @param {string} trend - Trend (declining, stable, growing, emerging)
   */
  setTrend(trend) {
    const validTrends = ['declining', 'stable', 'growing', 'emerging'];
    if (!validTrends.includes(trend)) {
      throw new Error(`Invalid trend: ${trend}`);
    }
    this.trend = trend;
    this.updatedAt = new Date();
  }

  /**
   * Checks if skill is active
   * @returns {boolean} True if skill is active
   */
  isSkillActive() {
    return this.isActive === true;
  }

  /**
   * Checks if skill is popular (popularity > 100)
   * @returns {boolean} True if skill is popular
   */
  isPopular() {
    return this.popularity > 100;
  }

  /**
   * Checks if skill is in high demand
   * @returns {boolean} True if demand level is high or critical
   */
  isHighDemand() {
    return this.demandLevel === 'high' || this.demandLevel === 'critical';
  }

  /**
   * Checks if skill is trending
   * @returns {boolean} True if trend is growing or emerging
   */
  isTrending() {
    return this.trend === 'growing' || this.trend === 'emerging';
  }

  /**
   * Checks if skill is root level (no parent)
   * @returns {boolean} True if skill has no parent
   */
  isRootLevel() {
    return this.parentId === null;
  }

  /**
   * Checks if skill is a sub-skill (has parent)
   * @returns {boolean} True if skill has a parent
   */
  isSubSkill() {
    return this.parentId !== null;
  }
}

module.exports = Skill;
