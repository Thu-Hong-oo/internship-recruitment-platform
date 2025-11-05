const CV = require('../../domain/profile/CV');
const ANALYSIS_STATUS = require('../../domain/ai-matching/enums/AnalysisStatus');

/**
 * CVMapper
 *
 * Converts between Mongoose documents and CV domain entities.
 *
 * Responsibilities:
 * - Transform Mongoose documents to domain entities (toDomain)
 * - Transform domain entities to Mongoose-compatible objects (toMongoose)
 * - Handle file metadata and analysis status
 * - Preserve data integrity during transformation
 *
 * Following Clean Architecture principles:
 * - Pure transformation logic only
 * - No business logic
 * - No default values
 * - No side effects
 */
class CVMapper {
  /**
   * Converts Mongoose document to CV domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {CV|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    return new CV(
      mongooseDoc._id?.toString(),
      mongooseDoc.candidateId?.toString(),
      mongooseDoc.originalName,
      mongooseDoc.cloudinaryPublicId,
      mongooseDoc.cloudinaryUrl,
      mongooseDoc.fileSize,
      mongooseDoc.mimeType,
      mongooseDoc.isActive,
      mongooseDoc.isDefault,
      mongooseDoc.analysisStatus || ANALYSIS_STATUS.PENDING,
      mongooseDoc.uploadedAt,
      mongooseDoc.createdAt,
      mongooseDoc.updatedAt
    );
  }

  /**
   * Converts CV domain entity to Mongoose-compatible object
   * @param {CV} domainEntity - Domain entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    const data = {
      candidateId: domainEntity.candidateId,
      originalName: domainEntity.originalName,
      isActive: domainEntity.isActive,
      isDefault: domainEntity.isDefault,
      analysisStatus: domainEntity.analysisStatus,
    };

    // Add optional fields if present
    if (domainEntity.cloudinaryPublicId !== null) {
      data.cloudinaryPublicId = domainEntity.cloudinaryPublicId;
    }

    if (domainEntity.cloudinaryUrl !== null) {
      data.cloudinaryUrl = domainEntity.cloudinaryUrl;
    }

    if (domainEntity.fileSize !== null) {
      data.fileSize = domainEntity.fileSize;
    }

    if (domainEntity.mimeType !== null) {
      data.mimeType = domainEntity.mimeType;
    }

    if (domainEntity.uploadedAt !== null) {
      data.uploadedAt = domainEntity.uploadedAt;
    }

    return data;
  }

  /**
   * Converts array of Mongoose documents to array of domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<CV>} Array of domain entities
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

module.exports = CVMapper;
