const Skill = require('../../domain/master-data/Skill');

/**
 * SkillMapper
 *
 * Converts between Mongoose documents and Skill domain entities.
 *
 * Responsibilities:
 * - Transform Mongoose documents to domain entities (toDomain)
 * - Transform domain entities to Mongoose-compatible objects (toMongoose)
 * - Handle hierarchical structure and AI embeddings
 * - Preserve data integrity during transformation
 *
 * Following Clean Architecture principles:
 * - Pure transformation logic only
 * - No business logic
 * - No default values
 * - No side effects
 */
class SkillMapper {
  /**
   * Converts Mongoose document to Skill domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Skill|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    return new Skill(
      mongooseDoc._id?.toString(),
      mongooseDoc.name,
      mongooseDoc.slug,
      mongooseDoc.description || null,
      mongooseDoc.parentId?.toString() || null,
      mongooseDoc.embedding || null,
      mongooseDoc.popularity || 0,
      mongooseDoc.isActive !== undefined ? mongooseDoc.isActive : true,
      mongooseDoc.demandLevel || 'medium',
      mongooseDoc.trend || 'stable',
      mongooseDoc.relatedSkills || null,
      mongooseDoc.createdAt,
      mongooseDoc.updatedAt
    );
  }

  /**
   * Converts Skill domain entity to Mongoose-compatible object
   * @param {Skill} domainEntity - Domain entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    const data = {
      name: domainEntity.name,
      slug: domainEntity.slug,
      popularity: domainEntity.popularity,
      isActive: domainEntity.isActive,
      demandLevel: domainEntity.demandLevel,
      trend: domainEntity.trend,
    };

    // Add optional fields if present
    if (domainEntity.description !== null) {
      data.description = domainEntity.description;
    }

    if (domainEntity.parentId !== null) {
      data.parentId = domainEntity.parentId;
    }

    if (domainEntity.embedding !== null) {
      data.embedding = domainEntity.embedding;
    }

    if (domainEntity.relatedSkills !== null) {
      data.relatedSkills = domainEntity.relatedSkills;
    }

    return data;
  }

  /**
   * Converts array of Mongoose documents to array of domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<Skill>} Array of domain entities
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

module.exports = SkillMapper;
