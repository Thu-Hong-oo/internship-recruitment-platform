/**
 * MessageMapper
 * Maps between Mongoose models and Message domain entities
 * Pure transformation - no business logic
 */

const Message = require('../../domain/chat/Message');

class MessageMapper {
  /**
   * Convert Mongoose document to domain entity
   * @param {Object} mongooseDoc - Mongoose Message document
   * @returns {Message|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) {
      return null;
    }

    try {
      // Convert ObjectIds to strings
      const conversationId = mongooseDoc.conversationId?.toString();
      const senderId = mongooseDoc.senderId?.toString();

      // Map attachments
      const attachments = Array.isArray(mongooseDoc.attachments)
        ? mongooseDoc.attachments.map(att => ({
            url: att.url,
            type: att.type,
            size: att.size || null,
            name: att.name || null,
            uploadedAt: att.uploadedAt || null,
          }))
        : [];

      // Map readBy array
      const readBy = Array.isArray(mongooseDoc.readBy)
        ? mongooseDoc.readBy.map(id => {
            if (typeof id === 'object' && id._id) {
              return id._id.toString();
            }
            return id.toString();
          })
        : [];

      return new Message(
        mongooseDoc._id?.toString(),
        conversationId,
        senderId,
        mongooseDoc.content || '',
        mongooseDoc.type || Message.Type.TEXT,
        attachments,
        readBy,
        mongooseDoc.deliveredAt || null,
        mongooseDoc.readAt || null,
        mongooseDoc.isDeleted || false,
        mongooseDoc.deletedAt || null,
        mongooseDoc.editedAt || null,
        mongooseDoc.metadata || {},
        mongooseDoc.createdAt,
        mongooseDoc.updatedAt
      );
    } catch (error) {
      console.error('Error mapping Message to domain:', error);
      return null;
    }
  }

  /**
   * Convert domain entity to Mongoose-compatible object
   * @param {Message} domainEntity - Domain Message entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    if (!domainEntity) {
      return null;
    }

    const data = {
      conversationId: domainEntity.conversationId,
      senderId: domainEntity.senderId,
      content: domainEntity.content || '',
      type: domainEntity.type,
      attachments: domainEntity.attachments || [],
      readBy: domainEntity.readBy || [],
      isDeleted: domainEntity.isDeleted || false,
      metadata: domainEntity.metadata || {},
    };

    // Optional fields - only include if not null
    if (domainEntity.deliveredAt !== null) {
      data.deliveredAt = domainEntity.deliveredAt;
    }

    if (domainEntity.readAt !== null) {
      data.readAt = domainEntity.readAt;
    }

    if (domainEntity.deletedAt !== null) {
      data.deletedAt = domainEntity.deletedAt;
    }

    if (domainEntity.editedAt !== null) {
      data.editedAt = domainEntity.editedAt;
    }

    if (domainEntity.createdAt !== null) {
      data.createdAt = domainEntity.createdAt;
    }

    if (domainEntity.updatedAt !== null) {
      data.updatedAt = domainEntity.updatedAt;
    }

    return data;
  }

  /**
   * Convert array of Mongoose documents to domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<Message>} Array of domain entities
   */
  static toDomainArray(mongooseDocs) {
    if (!mongooseDocs || !Array.isArray(mongooseDocs)) {
      return [];
    }

    return mongooseDocs
      .map(doc => this.toDomain(doc))
      .filter(entity => entity !== null);
  }

  /**
   * Convert domain entity to update object (excludes immutable fields)
   * @param {Message} domainEntity - Domain entity
   * @returns {Object} Update object for Mongoose
   */
  static toMongooseUpdate(domainEntity) {
    const data = this.toMongoose(domainEntity);

    // Remove fields that shouldn't be updated
    delete data.conversationId; // Immutable
    delete data.senderId; // Immutable
    delete data.createdAt; // Immutable

    // Ensure updatedAt is set
    data.updatedAt = new Date();

    return data;
  }

  /**
   * Create a lightweight DTO for message preview
   * @param {Message} domainEntity - Domain entity
   * @returns {Object} Lightweight message preview
   */
  static toPreview(domainEntity) {
    if (!domainEntity) {
      return null;
    }

    return {
      id: domainEntity.id,
      conversationId: domainEntity.conversationId,
      senderId: domainEntity.senderId,
      preview: domainEntity.getPreview(50),
      type: domainEntity.type,
      hasAttachments: domainEntity.hasAttachments(),
      isRead: domainEntity.isRead(),
      createdAt: domainEntity.createdAt,
    };
  }
}

module.exports = MessageMapper;
