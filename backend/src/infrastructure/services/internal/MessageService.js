const MessageRepository = require('../../repositories/MessageRepository');
const ConversationRepository = require('../../repositories/ConversationRepository');
const UserRepository = require('../../repositories/UserRepository');
const ValidationService = require('./ValidationService');

class MessageService {
  constructor() {
    this.messageRepository = new MessageRepository();
    this.conversationRepository = new ConversationRepository();
    this.userRepository = new UserRepository();
    this.validationService = new ValidationService();
  }

  async sendMessage(messageData) {
    try {
      // Validate message data
      const validation = this.validationService.validateMessage(messageData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if conversation exists
      const conversation = await this.conversationRepository.findById(
        messageData.conversationId
      );
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if sender is a participant in the conversation
      if (!conversation.participants.includes(messageData.senderId)) {
        throw new Error('Sender is not a participant in this conversation');
      }

      // Create message
      const message = await this.messageRepository.create(messageData);

      // Update conversation's last message timestamp
      await this.conversationRepository.update(messageData.conversationId, {
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: {
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          isDeleted: message.isDeleted,
          createdAt: message.createdAt,
        },
        message: 'Message sent successfully',
      };
    } catch (error) {
      throw new Error(`Send message failed: ${error.message}`);
    }
  }

  async getMessageById(messageId) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      return {
        success: true,
        message: {
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          isDeleted: message.isDeleted,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get message by ID failed: ${error.message}`);
    }
  }

  async updateMessage(messageId, updateData) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.isDeleted) {
        throw new Error('Cannot update deleted message');
      }

      // Validate update data
      const validation = this.validationService.validateMessage(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update message
      const updatedMessage = await this.messageRepository.update(
        messageId,
        updateData
      );

      return {
        success: true,
        message: {
          id: updatedMessage._id,
          conversationId: updatedMessage.conversationId,
          senderId: updatedMessage.senderId,
          content: updatedMessage.content,
          type: updatedMessage.type,
          isDeleted: updatedMessage.isDeleted,
          updatedAt: updatedMessage.updatedAt,
        },
        message: 'Message updated successfully',
      };
    } catch (error) {
      throw new Error(`Update message failed: ${error.message}`);
    }
  }

  async deleteMessage(messageId) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.isDeleted) {
        throw new Error('Message already deleted');
      }

      // Soft delete message
      const updatedMessage = await this.messageRepository.update(messageId, {
        isDeleted: true,
      });

      return {
        success: true,
        message: {
          id: updatedMessage._id,
          isDeleted: updatedMessage.isDeleted,
        },
        message: 'Message deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete message failed: ${error.message}`);
    }
  }

  async getUserMessages(userId, filters = {}) {
    try {
      const { page = 1, limit = 50, conversationId, type, isDeleted } = filters;
      const skip = (page - 1) * limit;

      const query = { senderId: userId };
      if (conversationId) query.conversationId = conversationId;
      if (type) query.type = type;
      if (isDeleted !== undefined) query.isDeleted = isDeleted;

      const messages = await this.messageRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['conversationId'],
      });

      const total = await this.messageRepository.count(query);

      return {
        success: true,
        messages: messages.map(message => ({
          id: message._id,
          conversationId: message.conversationId,
          content: message.content,
          type: message.type,
          isDeleted: message.isDeleted,
          createdAt: message.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get user messages failed: ${error.message}`);
    }
  }

  async getAllMessages(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        conversationId,
        senderId,
        type,
        isDeleted,
      } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (conversationId) query.conversationId = conversationId;
      if (senderId) query.senderId = senderId;
      if (type) query.type = type;
      if (isDeleted !== undefined) query.isDeleted = isDeleted;

      const messages = await this.messageRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['senderId', 'conversationId'],
      });

      const total = await this.messageRepository.count(query);

      return {
        success: true,
        messages: messages.map(message => ({
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          isDeleted: message.isDeleted,
          createdAt: message.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all messages failed: ${error.message}`);
    }
  }

  async getMessageStats() {
    try {
      const totalMessages = await this.messageRepository.count({});
      const activeMessages = await this.messageRepository.count({
        isDeleted: false,
      });
      const deletedMessages = await this.messageRepository.count({
        isDeleted: true,
      });

      const messagesByType = await this.messageRepository.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        stats: {
          totalMessages,
          activeMessages,
          deletedMessages,
          messagesByType,
        },
      };
    } catch (error) {
      throw new Error(`Get message stats failed: ${error.message}`);
    }
  }

  async searchMessages(searchQuery, filters = {}) {
    try {
      const { page = 1, limit = 50, conversationId, senderId } = filters;
      const skip = (page - 1) * limit;

      const query = {
        content: { $regex: searchQuery, $options: 'i' },
        isDeleted: false,
      };
      if (conversationId) query.conversationId = conversationId;
      if (senderId) query.senderId = senderId;

      const messages = await this.messageRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['senderId', 'conversationId'],
      });

      const total = await this.messageRepository.count(query);

      return {
        success: true,
        messages: messages.map(message => ({
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Search messages failed: ${error.message}`);
    }
  }

  async getMessageTrends() {
    try {
      const trends = await this.messageRepository.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        trends: trends.map(trend => ({
          type: trend._id,
          count: trend.count,
        })),
      };
    } catch (error) {
      throw new Error(`Get message trends failed: ${error.message}`);
    }
  }

  async getMessageRecommendations(userId) {
    try {
      // Get user's recent conversations
      const recentConversations = await this.conversationRepository.find(
        {
          participants: userId,
        },
        {
          limit: 5,
          sort: { updatedAt: -1 },
        }
      );

      const conversationIds = recentConversations.map(conv => conv._id);

      // Get recent messages from these conversations
      const recentMessages = await this.messageRepository.find(
        {
          conversationId: { $in: conversationIds },
          senderId: { $ne: userId },
          isDeleted: false,
        },
        {
          limit: 10,
          sort: { createdAt: -1 },
          populate: ['senderId', 'conversationId'],
        }
      );

      return {
        success: true,
        recommendations: recentMessages.map(message => ({
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get message recommendations failed: ${error.message}`);
    }
  }

  async getMessageHistory(messageId) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Get message history (if it was edited)
      const history = await this.messageRepository.find(
        {
          _id: messageId,
        },
        {
          sort: { updatedAt: 1 },
        }
      );

      return {
        success: true,
        history: history.map(msg => ({
          id: msg._id,
          content: msg.content,
          type: msg.type,
          isDeleted: msg.isDeleted,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get message history failed: ${error.message}`);
    }
  }
}

module.exports = new MessageService();


