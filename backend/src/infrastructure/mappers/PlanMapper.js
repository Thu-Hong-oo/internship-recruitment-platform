/**
 * PlanMapper - Pure transformation between Mongoose and Domain
 * Handles: features object
 */

const Plan = require('../../domain/subscription/Plan');

class PlanMapper {
  /**
   * Convert Mongoose document to Plan domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Plan|null} Domain entity
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    try {
      return new Plan(
        mongooseDoc._id?.toString(),
        mongooseDoc.name,
        mongooseDoc.description,
        mongooseDoc.price,
        mongooseDoc.currency || 'USD',
        mongooseDoc.billingPeriod
          ? mongooseDoc.billingPeriod.toUpperCase()
          : 'MONTHLY',
        mongooseDoc.features || {},
        mongooseDoc.isActive !== false, // Default to true if not set
        mongooseDoc.sortOrder || 0,
        mongooseDoc.createdAt,
        mongooseDoc.updatedAt
      );
    } catch (error) {
      console.error('Error mapping Plan to domain:', error);
      return null;
    }
  }

  /**
   * Convert Plan domain entity to Mongoose data
   * @param {Plan} domainEntity - Domain entity
   * @returns {Object} Mongoose data
   */
  static toMongoose(domainEntity) {
    if (!domainEntity) return null;

    return {
      name: domainEntity.name,
      description: domainEntity.description,
      price: domainEntity.price,
      currency: domainEntity.currency,
      billingPeriod: domainEntity.billingPeriod.toLowerCase(),
      features: domainEntity.features,
      isActive: domainEntity.isActive,
      sortOrder: domainEntity.sortOrder,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * Convert for Mongoose update (excludes immutable fields)
   * @param {Plan} domainEntity - Domain entity
   * @returns {Object} Update data
   */
  static toMongooseUpdate(domainEntity) {
    const data = this.toMongoose(domainEntity);

    // Remove immutable fields
    delete data.createdAt;

    return data;
  }

  /**
   * Convert array of Mongoose documents to domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<Plan>} Array of domain entities
   */
  static toDomainArray(mongooseDocs) {
    if (!Array.isArray(mongooseDocs)) return [];

    return mongooseDocs
      .map(doc => this.toDomain(doc))
      .filter(entity => entity !== null);
  }

  /**
   * Convert to lightweight preview (for lists)
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Object|null} Preview object
   */
  static toPreview(mongooseDoc) {
    if (!mongooseDoc) return null;

    return {
      id: mongooseDoc._id?.toString(),
      name: mongooseDoc.name,
      description: mongooseDoc.description,
      price: mongooseDoc.price,
      currency: mongooseDoc.currency || 'USD',
      billingPeriod: mongooseDoc.billingPeriod
        ? mongooseDoc.billingPeriod.toUpperCase()
        : 'MONTHLY',
      isActive: mongooseDoc.isActive !== false,
      sortOrder: mongooseDoc.sortOrder || 0,
      maxJobPostings: mongooseDoc.features?.maxJobPostings || 0,
      hasAiMatching: mongooseDoc.features?.aiMatching || false,
      createdAt: mongooseDoc.createdAt,
      updatedAt: mongooseDoc.updatedAt,
    };
  }
}

module.exports = PlanMapper;
