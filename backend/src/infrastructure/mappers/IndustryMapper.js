const Industry = require('../../domain/master-data/Industry');

/**
 * IndustryMapper
 *
 * Converts between Mongoose documents and Industry domain entities.
 *
 * Responsibilities:
 * - Transform Mongoose documents to domain entities (toDomain)
 * - Transform domain entities to Mongoose-compatible objects (toMongoose)
 * - Handle multilingual fields and hierarchical structure
 * - Preserve data integrity during transformation
 *
 * Following Clean Architecture principles:
 * - Pure transformation logic only
 * - No business logic
 * - No default values
 * - No side effects
 */
class IndustryMapper {
  /**
   * Converts Mongoose document to Industry domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Industry|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    return new Industry(
      mongooseDoc._id?.toString(),
      mongooseDoc.code,
      mongooseDoc.name, // { vi, en }
      mongooseDoc.description || null,
      mongooseDoc.parentCode || null,
      mongooseDoc.path || null,
      mongooseDoc.color || '#2563eb',
      mongooseDoc.icon || null,
      mongooseDoc.keywords || null,
      mongooseDoc.suggestedTemplates || null,
      mongooseDoc.suggestions || null,
      mongooseDoc.visible !== undefined ? mongooseDoc.visible : true,
      mongooseDoc.sortOrder || 0,
      mongooseDoc.createdAt,
      mongooseDoc.updatedAt
    );
  }

  /**
   * Converts Industry domain entity to Mongoose-compatible object
   * @param {Industry} domainEntity - Domain entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    const data = {
      code: domainEntity.code,
      name: domainEntity.name,
      color: domainEntity.color,
      visible: domainEntity.visible,
      sortOrder: domainEntity.sortOrder,
    };

    // Add optional fields if present
    if (domainEntity.description !== null) {
      data.description = domainEntity.description;
    }

    if (domainEntity.parentCode !== null) {
      data.parentCode = domainEntity.parentCode;
    }

    if (domainEntity.path !== null) {
      data.path = domainEntity.path;
    }

    if (domainEntity.icon !== null) {
      data.icon = domainEntity.icon;
    }

    if (domainEntity.keywords !== null) {
      data.keywords = domainEntity.keywords;
    }

    if (domainEntity.suggestedTemplates !== null) {
      data.suggestedTemplates = domainEntity.suggestedTemplates;
    }

    if (domainEntity.suggestions !== null) {
      data.suggestions = domainEntity.suggestions;
    }

    return data;
  }

  /**
   * Converts array of Mongoose documents to array of domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<Industry>} Array of domain entities
   */
  static toDomainArray(mongooseDocs) {
    if (!mongooseDocs || !Array.isArray(mongooseDocs)) {
      return [];
    }
    return mongooseDocs
      .map(doc => this.toDomain(doc))
      .filter(entity => entity !== null);
  }
}

module.exports = IndustryMapper;
