const User = require('../../domain/identity/User');
const UserRole = require('../../domain/identity/enums/UserRole');
const UserStatus = require('../../domain/identity/enums/UserStatus');
const AuthProvider = require('../../domain/identity/enums/AuthProvider');

/**
 * UserMapper
 *
 * Converts between Mongoose documents and User domain entities.
 *
 * Responsibilities:
 * - Transform Mongoose documents to domain entities (toDomain)
 * - Transform domain entities to Mongoose-compatible objects (toMongoose)
 * - Handle authentication providers and OAuth data
 * - Preserve data integrity during transformation
 *
 * Following Clean Architecture principles:
 * - Pure transformation logic only
 * - No business logic
 * - No default values
 * - No side effects
 */
class UserMapper {
  /**
   * Converts Mongoose document to User domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {User|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    return new User(
      mongooseDoc._id?.toString(),
      mongooseDoc.email,
      mongooseDoc.fullName,
      mongooseDoc.role,
      mongooseDoc.status || UserStatus.PENDING_VERIFICATION,
      mongooseDoc.provider || AuthProvider.EMAIL,
      mongooseDoc.password,
      mongooseDoc.avatarUrl || mongooseDoc.avatar, // Handle both field names
      mongooseDoc.isEmailVerified || false,
      mongooseDoc.googleProfile || null,
      mongooseDoc.preferences || null,
      mongooseDoc.lastLogin || null,
      mongooseDoc.candidateProfile?.toString() || null,
      mongooseDoc.employerProfile?.toString() || null,
      mongooseDoc.createdAt,
      mongooseDoc.updatedAt
    );
  }

  /**
   * Converts User domain entity to Mongoose-compatible object
   * @param {User} domainEntity - Domain entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    const data = {
      email: domainEntity.email,
      fullName: domainEntity.fullName,
      role: domainEntity.role,
      status: domainEntity.status,
      provider: domainEntity.provider,
      isEmailVerified: domainEntity.isEmailVerified,
    };

    // Add optional fields if present
    if (domainEntity.password !== null) {
      data.password = domainEntity.password;
    }

    if (domainEntity.avatarUrl !== null) {
      data.avatarUrl = domainEntity.avatarUrl;
      data.avatar = domainEntity.avatarUrl; // For backward compatibility
    }

    if (domainEntity.googleProfile !== null) {
      data.googleProfile = domainEntity.googleProfile;
    }

    if (domainEntity.preferences !== null) {
      data.preferences = domainEntity.preferences;
    }

    if (domainEntity.lastLogin !== null) {
      data.lastLogin = domainEntity.lastLogin;
    }

    if (domainEntity.candidateProfileId !== null) {
      data.candidateProfile = domainEntity.candidateProfileId;
    }

    if (domainEntity.employerProfileId !== null) {
      data.employerProfile = domainEntity.employerProfileId;
    }

    return data;
  }

  /**
   * Converts array of Mongoose documents to array of domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<User>} Array of domain entities
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

module.exports = UserMapper;
