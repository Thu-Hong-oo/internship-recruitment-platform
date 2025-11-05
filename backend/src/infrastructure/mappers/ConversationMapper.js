/**
 * ConversationMapper
 * Maps between Mongoose models and Conversation domain entities
 * Pure transformation - no business logic
 */

const Conversation = require('../../domain/chat/Conversation');

class ConversationMapper {
  /**
   * Convert Mongoose document to domain entity
   * @param {Object} mongooseDoc - Mongoose Conversation document
   * @returns {Conversation|null} Domain entity or null
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) {
      return null;
    }

    try {
      // Convert ObjectIds to strings for participants
      const participants = Array.isArray(mongooseDoc.participants)
        ? mongooseDoc.participants.map(p => {
            // Handle populated participants
            if (typeof p === 'object' && p._id) {
              return p._id.toString();
            }
            return p.toString();
          })
        : [];

      // Handle lastMessage object
      let lastMessage = null;
      if (mongooseDoc.lastMessage) {
        lastMessage = {
          messageId: mongooseDoc.lastMessage.messageId?.toString() || null,
          content:
            mongooseDoc.lastMessage.text ||
            mongooseDoc.lastMessage.content ||
            '',
          senderId: mongooseDoc.lastMessage.senderId?.toString() || null,
          sentAt:
            mongooseDoc.lastMessage.timestamp ||
            mongooseDoc.lastMessage.sentAt ||
            null,
        };
      }

      return new Conversation(
        mongooseDoc._id?.toString(),
        mongooseDoc.type || Conversation.Type.DIRECT,
        participants,
        mongooseDoc.status || Conversation.Status.ACTIVE,
        mongooseDoc.jobId?.toString() || null,
        mongooseDoc.applicationId?.toString() || null,
        lastMessage,
        mongooseDoc.metadata || {},
        mongooseDoc.createdAt,
        mongooseDoc.updatedAt
      );
    } catch (error) {
      console.error('Error mapping Conversation to domain:', error);
      return null;
    }
  }

  /**
   * Convert domain entity to Mongoose-compatible object
   * @param {Conversation} domainEntity - Domain Conversation entity
   * @returns {Object} Mongoose-compatible object
   */
  static toMongoose(domainEntity) {
    if (!domainEntity) {
      return null;
    }

    const data = {
      type: domainEntity.type,
      participants: domainEntity.participants,
      status: domainEntity.status,
      metadata: domainEntity.metadata || {},
    };

    // Optional fields - only include if not null
    if (domainEntity.jobId !== null) {
      data.jobId = domainEntity.jobId;
    }

    if (domainEntity.applicationId !== null) {
      data.applicationId = domainEntity.applicationId;
    }

    if (domainEntity.lastMessage !== null) {
      data.lastMessage = {
        messageId: domainEntity.lastMessage.messageId,
        text: domainEntity.lastMessage.content,
        content: domainEntity.lastMessage.content,
        senderId: domainEntity.lastMessage.senderId,
        timestamp: domainEntity.lastMessage.sentAt,
      };
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
   * @returns {Array<Conversation>} Array of domain entities
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
   * @param {Conversation} domainEntity - Domain entity
   * @returns {Object} Update object for Mongoose
   */
  static toMongooseUpdate(domainEntity) {
    const data = this.toMongoose(domainEntity);

    // Remove fields that shouldn't be updated
    delete data.createdAt;

    // Ensure updatedAt is set
    data.updatedAt = new Date();

    return data;
  }
}

module.exports = ConversationMapper;
