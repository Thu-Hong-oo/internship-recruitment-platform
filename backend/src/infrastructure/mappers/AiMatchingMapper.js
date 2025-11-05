/**
 * AiMatchingMapper - Pure transformation between Mongoose and Domain
 * Handles: score breakdown, recommendations array
 */

const AiMatching = require('../../domain/ai-matching/AiMatching');

class AiMatchingMapper {
  /**
   * Convert Mongoose document to AiMatching domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {AiMatching|null} Domain entity
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    try {
      // Handle score breakdown
      const scoreBreakdown = {
        skillScore: mongooseDoc.scoreBreakdown?.skillScore || 0,
        experienceScore: mongooseDoc.scoreBreakdown?.experienceScore || 0,
        educationScore: mongooseDoc.scoreBreakdown?.educationScore || 0,
        locationScore: mongooseDoc.scoreBreakdown?.locationScore || 0,
      };

      return new AiMatching(
        mongooseDoc._id?.toString(),
        mongooseDoc.candidateId?.toString(),
        mongooseDoc.jobId?.toString(),
        mongooseDoc.overallScore,
        scoreBreakdown,
        mongooseDoc.confidence,
        mongooseDoc.recommendations || [],
        mongooseDoc.matchType ? mongooseDoc.matchType.toUpperCase() : 'INITIAL',
        mongooseDoc.metadata || null,
        mongooseDoc.createdAt,
        mongooseDoc.updatedAt
      );
    } catch (error) {
      console.error('Error mapping AiMatching to domain:', error);
      return null;
    }
  }

  /**
   * Convert AiMatching domain entity to Mongoose data
   * @param {AiMatching} domainEntity - Domain entity
   * @returns {Object} Mongoose data
   */
  static toMongoose(domainEntity) {
    if (!domainEntity) return null;

    return {
      candidateId: domainEntity.candidateId,
      jobId: domainEntity.jobId,
      overallScore: domainEntity.overallScore,
      scoreBreakdown: {
        skillScore: domainEntity.scoreBreakdown.skillScore,
        experienceScore: domainEntity.scoreBreakdown.experienceScore,
        educationScore: domainEntity.scoreBreakdown.educationScore,
        locationScore: domainEntity.scoreBreakdown.locationScore,
      },
      confidence: domainEntity.confidence,
      recommendations: domainEntity.recommendations,
      matchType: domainEntity.matchType.toLowerCase(),
      metadata: domainEntity.metadata,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * Convert for Mongoose update (excludes immutable fields)
   * @param {AiMatching} domainEntity - Domain entity
   * @returns {Object} Update data
   */
  static toMongooseUpdate(domainEntity) {
    const data = this.toMongoose(domainEntity);

    // Remove immutable fields
    delete data.candidateId;
    delete data.jobId;
    delete data.createdAt;

    return data;
  }

  /**
   * Convert array of Mongoose documents to domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<AiMatching>} Array of domain entities
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

    // Calculate quality without creating full entity
    let quality = 'POOR';
    const score = mongooseDoc.overallScore || 0;
    if (score >= 0.8) quality = 'EXCELLENT';
    else if (score >= 0.6) quality = 'GOOD';
    else if (score >= 0.4) quality = 'FAIR';

    return {
      id: mongooseDoc._id?.toString(),
      candidateId: mongooseDoc.candidateId?.toString(),
      jobId: mongooseDoc.jobId?.toString(),
      overallScore: mongooseDoc.overallScore,
      quality,
      confidence: mongooseDoc.confidence,
      matchType: mongooseDoc.matchType
        ? mongooseDoc.matchType.toUpperCase()
        : 'INITIAL',
      recommendationsCount: mongooseDoc.recommendations?.length || 0,
      createdAt: mongooseDoc.createdAt,
      updatedAt: mongooseDoc.updatedAt,
    };
  }
}

module.exports = AiMatchingMapper;
