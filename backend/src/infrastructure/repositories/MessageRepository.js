const MessageModel = require('../models/Message');
const MessageMapper = require('../mappers/MessageMapper');

/**
 * MessageRepository
 * Infrastructure layer repository for Message entity
 * Returns domain entities using MessageMapper
 */
class MessageRepository {
  /**
   * Find message by ID
   * @param {string} id - Message ID
   * @returns {Promise<Message|null>} Domain entity or null
   */
  async findById(id) {
    const doc = await MessageModel.findById(id);
    return MessageMapper.toDomain(doc);
  }

  /**
   * Find all messages in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Maximum number of messages
   * @param {number} skip - Number of messages to skip
   * @returns {Promise<Array<Message>>} Array of domain entities
   */
  async findByConversation(conversationId, limit = 100, skip = 0) {
    const docs = await MessageModel.find({
      conversationId,
      isDeleted: false, // Only return non-deleted messages by default
    })
      .sort({ createdAt: -1 }) // Newest first for pagination
      .limit(limit)
      .skip(skip);

    // Reverse to get chronological order for display
    return MessageMapper.toDomainArray(docs.reverse());
  }

  /**
   * Find messages sent by a specific user
   * @param {string} senderId - Sender ID
   * @param {number} limit - Maximum number of messages
   * @returns {Promise<Array<Message>>} Array of domain entities
   */
  async findBySender(senderId, limit = 100) {
    const docs = await MessageModel.find({
      senderId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return MessageMapper.toDomainArray(docs);
  }

  /**
   * Find recent messages before a specific message (for infinite scroll)
   * @param {string} conversationId - Conversation ID
   * @param {Date} beforeDate - Get messages before this date
   * @param {number} limit - Maximum number of messages
   * @returns {Promise<Array<Message>>} Array of domain entities
   */
  async findBeforeDate(conversationId, beforeDate, limit = 50) {
    const docs = await MessageModel.find({
      conversationId,
      createdAt: { $lt: beforeDate },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return MessageMapper.toDomainArray(docs.reverse());
  }

  /**
   * Find all messages (admin only - use with caution)
   * @param {number} limit - Maximum number of results
   * @param {number} skip - Number of results to skip
   * @returns {Promise<Array<Message>>} Array of domain entities
   */
  async findAll(limit = 100, skip = 0) {
    const docs = await MessageModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return MessageMapper.toDomainArray(docs);
  }

  /**
   * Create new message
   * @param {Message} entity - Domain entity
   * @returns {Promise<Message>} Created domain entity
   */
  async create(entity) {
    const data = MessageMapper.toMongoose(entity);
    const doc = new MessageModel(data);
    const saved = await doc.save();
    return MessageMapper.toDomain(saved);
  }

  /**
   * Update existing message
   * @param {string} id - Message ID
   * @param {Message} entity - Domain entity with updates
   * @returns {Promise<Message|null>} Updated domain entity or null
   */
  async update(id, entity) {
    const data = MessageMapper.toMongooseUpdate(entity);
    const updated = await MessageModel.findByIdAndUpdate(id, data, {
      new: true,
    });

    return MessageMapper.toDomain(updated);
  }

  /**
   * Soft delete message
   * @param {string} id - Message ID
   * @returns {Promise<Message|null>} Updated domain entity
   */
  async delete(id) {
    const updated = await MessageModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    return MessageMapper.toDomain(updated);
  }

  /**
   * Permanently delete message (use with caution)
   * @param {string} id - Message ID
   * @returns {Promise<boolean>} True if deleted
   */
  async permanentDelete(id) {
    const result = await MessageModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Find multiple messages by IDs
   * @param {Array<string>} ids - Array of message IDs
   * @returns {Promise<Array<Message>>} Array of domain entities
   */
  async findByIds(ids) {
    const docs = await MessageModel.find({ _id: { $in: ids } });
    return MessageMapper.toDomainArray(docs);
  }

  /**
   * Mark message as read by user
   * @param {string} id - Message ID
   * @param {string} userId - User ID
   * @returns {Promise<Message|null>} Updated domain entity
   */
  async markAsRead(id, userId) {
    const doc = await MessageModel.findById(id);

    if (!doc) {
      return null;
    }

    // Add userId to readBy array if not already present
    if (!doc.readBy.some(id => String(id) === String(userId))) {
      doc.readBy.push(userId);

      // Set readAt on first read
      if (doc.readBy.length === 1) {
        doc.readAt = new Date();
      }

      doc.updatedAt = new Date();
      await doc.save();
    }

    return MessageMapper.toDomain(doc);
  }

  /**
   * Mark all messages in conversation as read by user
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of messages updated
   */
  async markAllAsRead(conversationId, userId) {
    const result = await MessageModel.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
        isDeleted: false,
      },
      {
        $addToSet: { readBy: userId },
        $set: {
          readAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount || 0;
  }

  /**
   * Count unread messages in conversation for user
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of unread messages
   */
  async countUnreadByConversation(conversationId, userId) {
    return await MessageModel.countDocuments({
      conversationId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      isDeleted: false,
    });
  }

  /**
   * Count total unread messages for user across all conversations
   * @param {string} userId - User ID
   * @returns {Promise<number>} Total unread count
   */
  async countTotalUnread(userId) {
    return await MessageModel.countDocuments({
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      isDeleted: false,
    });
  }

  /**
   * Search messages in conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} searchText - Search text
   * @param {number} limit - Maximum results
   * @returns {Promise<Array<Message>>} Array of domain entities
   */
  async searchInConversation(conversationId, searchText, limit = 50) {
    const docs = await MessageModel.find({
      conversationId,
      content: { $regex: searchText, $options: 'i' },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return MessageMapper.toDomainArray(docs);
  }

  /**
   * Find messages with attachments in conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} attachmentType - Type of attachment (IMAGE, FILE, etc.)
   * @returns {Promise<Array<Message>>} Array of domain entities
   */
  async findWithAttachments(conversationId, attachmentType = null) {
    const query = {
      conversationId,
      'attachments.0': { $exists: true },
      isDeleted: false,
    };

    if (attachmentType) {
      query.type = attachmentType;
    }

    const docs = await MessageModel.find(query).sort({ createdAt: -1 });

    return MessageMapper.toDomainArray(docs);
  }

  /**
   * Delete old messages (cleanup job)
   * @param {Date} beforeDate - Delete messages before this date
   * @returns {Promise<number>} Number of deleted messages
   */
  async deleteOldMessages(beforeDate) {
    const result = await MessageModel.deleteMany({
      createdAt: { $lt: beforeDate },
      isDeleted: true,
    });

    return result.deletedCount || 0;
  }

  /**
   * Get conversation statistics
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(conversationId) {
    const [total, deleted, withAttachments] = await Promise.all([
      MessageModel.countDocuments({ conversationId }),
      MessageModel.countDocuments({ conversationId, isDeleted: true }),
      MessageModel.countDocuments({
        conversationId,
        'attachments.0': { $exists: true },
      }),
    ]);

    return {
      totalMessages: total,
      deletedMessages: deleted,
      messagesWithAttachments: withAttachments,
      activeMessages: total - deleted,
    };
  }
}

module.exports = MessageRepository;
