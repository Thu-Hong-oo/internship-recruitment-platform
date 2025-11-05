const Conversation = require('../models/Conversation');

/**
 * ConversationRepository
 * Infrastructure layer repository for Conversation entity
 */
class ConversationRepository {
  async findById(id) {
    return await Conversation.findById(id);
  }

  async findByParticipant(userId) {
    return await Conversation.find({
      participants: userId,
    }).populate('participants', 'firstName lastName email');
  }

  async findByParticipants(userId1, userId2) {
    return await Conversation.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
    });
  }

  async findAll() {
    return await Conversation.find().populate('participants');
  }

  async create(conversationData) {
    const conversation = new Conversation(conversationData);
    return await conversation.save();
  }

  async update(id, conversationData) {
    return await Conversation.findByIdAndUpdate(id, conversationData, {
      new: true,
    });
  }

  async delete(id) {
    return await Conversation.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await Conversation.find({ _id: { $in: ids } });
  }

  async updateLastMessage(id, messageId, messageText) {
    return await Conversation.findByIdAndUpdate(
      id,
      {
        lastMessage: {
          messageId,
          text: messageText,
          timestamp: new Date(),
        },
      },
      { new: true }
    );
  }

  async markAsRead(id, userId) {
    return await Conversation.findByIdAndUpdate(
      id,
      {
        $unset: { [`unreadCount.${userId}`]: 1 },
      },
      { new: true }
    );
  }

  async incrementUnreadCount(id, userId) {
    return await Conversation.findByIdAndUpdate(
      id,
      {
        $inc: { [`unreadCount.${userId}`]: 1 },
      },
      { new: true }
    );
  }
}

module.exports = ConversationRepository;
