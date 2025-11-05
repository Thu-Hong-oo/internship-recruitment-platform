const Notification = require('../../domain/notification/Notification');
const NotificationType = require('../../domain/notification/enums/NotificationType');
const PriorityLevel = require('../../domain/notification/enums/PriorityLevel');

/**
 * NotificationMapper
 *
 * Converts between Mongoose documents and Notification domain entities.
 *
 * Responsibilities:
 * - Transform Mongoose documents to domain entities (toDomain)
 * - Transform domain entities to Mongoose-compatible objects (toMongoose)
 * - Handle notification types and priorities
 * - Preserve data integrity during transformation
 *
 * Following Clean Architecture principles:
 * - Pure transformation logic only
 * - No business logic
 * - No default values
 * - No side effects
 */
class NotificationMapper {
  /**
   * Converts Mongoose document to Notification domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Notification|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    return new Notification(
      mongooseDoc._id?.toString(),
      mongooseDoc.userId?.toString(),
      mongooseDoc.type,
      mongooseDoc.title,
      mongooseDoc.message,
      mongooseDoc.actionUrl || null,
      mongooseDoc.relatedJob?.toString() || null,
      mongooseDoc.relatedApplication?.toString() || null,
      mongooseDoc.isRead || false,
      mongooseDoc.priority || PriorityLevel.LOW,
      mongooseDoc.expiresAt || null,
      mongooseDoc.createdAt,
      mongooseDoc.updatedAt
    );
  }

  /**
   * Converts Notification domain entity to Mongoose-compatible object
   * @param {Notification} domainEntity - Domain entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    const data = {
      userId: domainEntity.userId,
      type: domainEntity.type,
      title: domainEntity.title,
      message: domainEntity.message,
      isRead: domainEntity.isRead,
      priority: domainEntity.priority,
    };

    // Add optional fields if present
    if (domainEntity.actionUrl !== null) {
      data.actionUrl = domainEntity.actionUrl;
    }

    if (domainEntity.relatedJobId !== null) {
      data.relatedJob = domainEntity.relatedJobId;
    }

    if (domainEntity.relatedApplicationId !== null) {
      data.relatedApplication = domainEntity.relatedApplicationId;
    }

    if (domainEntity.expiresAt !== null) {
      data.expiresAt = domainEntity.expiresAt;
    }

    return data;
  }

  /**
   * Converts array of Mongoose documents to array of domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<Notification>} Array of domain entities
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

module.exports = NotificationMapper;
