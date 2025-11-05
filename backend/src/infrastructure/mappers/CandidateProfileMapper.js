const CandidateProfile = require('../../domain/profile/CandidateProfile');

/**
 * CandidateProfileMapper
 *
 * Converts between Mongoose documents and CandidateProfile domain entities.
 *
 * Responsibilities:
 * - Transform Mongoose documents to domain entities (toDomain)
 * - Transform domain entities to Mongoose-compatible objects (toMongoose)
 * - Handle nested objects and arrays
 * - Preserve data integrity during transformation
 *
 * Following Clean Architecture principles:
 * - Pure transformation logic only
 * - No business logic
 * - No default values
 * - No side effects
 */
class CandidateProfileMapper {
  /**
   * Converts Mongoose document to CandidateProfile domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {CandidateProfile|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    return new CandidateProfile(
      mongooseDoc._id?.toString(),
      mongooseDoc.userId?.toString(),
      mongooseDoc.personalInfo || null,
      mongooseDoc.professionalInfo || null,
      mongooseDoc.education || null,
      mongooseDoc.experience || null,
      mongooseDoc.skills || null,
      mongooseDoc.preferences || null,
      mongooseDoc.profileCompleteness || 0,
      mongooseDoc.visibility || 'public',
      mongooseDoc.createdAt,
      mongooseDoc.updatedAt
    );
  }

  /**
   * Converts CandidateProfile domain entity to Mongoose-compatible object
   * @param {CandidateProfile} domainEntity - Domain entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    const data = {
      userId: domainEntity.userId,
      profileCompleteness: domainEntity.profileCompleteness,
      visibility: domainEntity.visibility,
    };

    // Add optional nested objects if present
    if (domainEntity.personalInfo !== null) {
      data.personalInfo = domainEntity.personalInfo;
    }

    if (domainEntity.professionalInfo !== null) {
      data.professionalInfo = domainEntity.professionalInfo;
    }

    if (domainEntity.education !== null) {
      data.education = domainEntity.education;
    }

    if (domainEntity.experience !== null) {
      data.experience = domainEntity.experience;
    }

    if (domainEntity.skills !== null) {
      data.skills = domainEntity.skills;
    }

    if (domainEntity.preferences !== null) {
      data.preferences = domainEntity.preferences;
    }

    return data;
  }

  /**
   * Converts array of Mongoose documents to array of domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<CandidateProfile>} Array of domain entities
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

module.exports = CandidateProfileMapper;
