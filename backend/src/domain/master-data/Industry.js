/**
 * Industry Domain Entity
 *
 * Represents an industry/sector in the recruitment system (e.g., "Technology", "Finance").
 * Supports hierarchical structure with parent-child relationships and multilingual names.
 *
 * Following Clean Architecture principles:
 * - No dependencies on infrastructure layer
 * - Business logic encapsulated within entity
 * - Constructor accepts only required fields
 * - Optional fields set to null (not undefined)
 * - No default values in constructor
 */
class Industry {
  constructor(
    industryId,
    code,
    name, // { vi: string, en: string }
    description = null, // { vi: string, en: string }
    parentCode = null,
    path = null, // Array of codes from root
    color = '#2563eb',
    icon = null,
    keywords = null,
    suggestedTemplates = null,
    suggestions = null, // { summary: [], experience: [], projects: [], skills: [] }
    visible = true,
    sortOrder = 0,
    createdAt = null,
    updatedAt = null
  ) {
    // Required fields
    this.industryId = industryId;
    this.code = code;
    this.name = name; // { vi, en }

    // Optional fields
    this.description = description; // { vi, en }
    this.parentCode = parentCode;
    this.path = path;

    // Appearance
    this.color = color;
    this.icon = icon;

    // Search & classification
    this.keywords = keywords;
    this.suggestedTemplates = suggestedTemplates;
    this.suggestions = suggestions;

    // Visibility
    this.visible = visible;
    this.sortOrder = sortOrder;

    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validates the industry entity
   * @throws {Error} if validation fails
   */
  validate() {
    if (!this.code || this.code.trim().length === 0) {
      throw new Error('Industry code is required');
    }

    if (!this.name || !this.name.vi || !this.name.en) {
      throw new Error('Industry name (both vi and en) is required');
    }
  }

  /**
   * Updates industry name
   * @param {Object} name - Name object { vi, en }
   */
  updateName(name) {
    if (!name.vi || !name.en) {
      throw new Error('Both Vietnamese and English names are required');
    }
    this.name = name;
    this.updatedAt = new Date();
  }

  /**
   * Updates industry description
   * @param {Object} description - Description object { vi, en }
   */
  updateDescription(description) {
    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * Shows the industry
   */
  show() {
    this.visible = true;
    this.updatedAt = new Date();
  }

  /**
   * Hides the industry
   */
  hide() {
    this.visible = false;
    this.updatedAt = new Date();
  }

  /**
   * Sets sort order
   * @param {number} order - Sort order
   */
  setSortOrder(order) {
    if (typeof order !== 'number') {
      throw new Error('Sort order must be a number');
    }
    this.sortOrder = order;
    this.updatedAt = new Date();
  }

  /**
   * Adds keyword
   * @param {string} keyword - Keyword to add
   */
  addKeyword(keyword) {
    if (!this.keywords) {
      this.keywords = [];
    }
    if (!this.keywords.includes(keyword)) {
      this.keywords.push(keyword);
      this.updatedAt = new Date();
    }
  }

  /**
   * Removes keyword
   * @param {string} keyword - Keyword to remove
   */
  removeKeyword(keyword) {
    if (this.keywords) {
      this.keywords = this.keywords.filter(k => k !== keyword);
      this.updatedAt = new Date();
    }
  }

  /**
   * Checks if industry is visible
   * @returns {boolean} True if industry is visible
   */
  isVisible() {
    return this.visible === true;
  }

  /**
   * Checks if industry is root level (no parent)
   * @returns {boolean} True if industry has no parent
   */
  isRootLevel() {
    return this.parentCode === null;
  }

  /**
   * Checks if industry is a sub-industry (has parent)
   * @returns {boolean} True if industry has a parent
   */
  isSubIndustry() {
    return this.parentCode !== null;
  }

  /**
   * Gets industry name in specified language
   * @param {string} lang - Language code ('vi' or 'en')
   * @returns {string} Industry name in specified language
   */
  getName(lang = 'vi') {
    return this.name[lang] || this.name.vi;
  }

  /**
   * Gets industry description in specified language
   * @param {string} lang - Language code ('vi' or 'en')
   * @returns {string} Industry description in specified language
   */
  getDescription(lang = 'vi') {
    if (!this.description) return '';
    return this.description[lang] || this.description.vi || '';
  }
}

module.exports = Industry;
