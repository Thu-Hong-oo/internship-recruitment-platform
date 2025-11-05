/**
 * ConversationService - Handles conversation operations
 * Dependencies injected via constructor for proper DI
 */
class ConversationService {
  constructor(
    conversationRepository,
    messageRepository,
    userRepository,
    validationService
  ) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
    this.userRepository = userRepository;
    this.validationService = validationService;
  }

  async createConversation(conversationData) {
    try {
      // Validate conversation data
      const validation =
        this.validationService.validateConversation(conversationData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if participants exist
      const participants = await this.userRepository.find({
        _id: { $in: conversationData.participants },
      });

      if (participants.length !== conversationData.participants.length) {
        throw new Error('One or more participants not found');
      }

      // Check if conversation already exists between participants
      const existingConversation = await this.conversationRepository.findOne({
        participants: { $all: conversationData.participants },
        type: conversationData.type,
      });

      if (existingConversation) {
        throw new Error(
          'Conversation already exists between these participants'
        );
      }

      // Create conversation
      const conversation = await this.conversationRepository.create(
        conversationData
      );

      return {
        success: true,
        conversation: {
          id: conversation._id,
          participants: conversation.participants,
          type: conversation.type,
          title: conversation.title,
          isActive: conversation.isActive,
          createdAt: conversation.createdAt,
        },
        message: 'Conversation created successfully',
      };
    } catch (error) {
      throw new Error(`Create conversation failed: ${error.message}`);
    }
  }

  async getConversationById(conversationId) {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      return {
        success: true,
        conversation: {
          id: conversation._id,
          participants: conversation.participants,
          type: conversation.type,
          title: conversation.title,
          isActive: conversation.isActive,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get conversation by ID failed: ${error.message}`);
    }
  }

  async updateConversation(conversationId, updateData) {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Validate update data
      const validation =
        this.validationService.validateConversation(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update conversation
      const updatedConversation = await this.conversationRepository.update(
        conversationId,
        updateData
      );

      return {
        success: true,
        conversation: {
          id: updatedConversation._id,
          participants: updatedConversation.participants,
          type: updatedConversation.type,
          title: updatedConversation.title,
          isActive: updatedConversation.isActive,
          updatedAt: updatedConversation.updatedAt,
        },
        message: 'Conversation updated successfully',
      };
    } catch (error) {
      throw new Error(`Update conversation failed: ${error.message}`);
    }
  }

  async deleteConversation(conversationId) {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Soft delete conversation
      await this.conversationRepository.softDelete(conversationId);

      return {
        success: true,
        message: 'Conversation deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete conversation failed: ${error.message}`);
    }
  }

  async getUserConversations(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, type, isActive } = filters;
      const skip = (page - 1) * limit;

      const query = { participants: userId };
      if (type) query.type = type;
      if (isActive !== undefined) query.isActive = isActive;

      const conversations = await this.conversationRepository.find(query, {
        skip,
        limit,
        sort: { updatedAt: -1 },
        populate: ['participants'],
      });

      const total = await this.conversationRepository.count(query);

      return {
        success: true,
        conversations: conversations.map(conversation => ({
          id: conversation._id,
          participants: conversation.participants,
          type: conversation.type,
          title: conversation.title,
          isActive: conversation.isActive,
          updatedAt: conversation.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get user conversations failed: ${error.message}`);
    }
  }

  async getAllConversations(filters = {}) {
    try {
      const { page = 1, limit = 20, type, isActive } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (type) query.type = type;
      if (isActive !== undefined) query.isActive = isActive;

      const conversations = await this.conversationRepository.find(query, {
        skip,
        limit,
        sort: { updatedAt: -1 },
        populate: ['participants'],
      });

      const total = await this.conversationRepository.count(query);

      return {
        success: true,
        conversations: conversations.map(conversation => ({
          id: conversation._id,
          participants: conversation.participants,
          type: conversation.type,
          title: conversation.title,
          isActive: conversation.isActive,
          updatedAt: conversation.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all conversations failed: ${error.message}`);
    }
  }

  async getConversationMessages(conversationId, filters = {}) {
    try {
      const { page = 1, limit = 50, isDeleted } = filters;
      const skip = (page - 1) * limit;

      const query = { conversationId };
      if (isDeleted !== undefined) query.isDeleted = isDeleted;

      const messages = await this.messageRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: 1 },
        populate: ['senderId'],
      });

      const total = await this.messageRepository.count(query);

      return {
        success: true,
        messages: messages.map(message => ({
          id: message._id,
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
      throw new Error(`Get conversation messages failed: ${error.message}`);
    }
  }

  async getConversationStats(conversationId) {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get conversation statistics
      const totalMessages = await this.messageRepository.count({
        conversationId,
      });
      const activeMessages = await this.messageRepository.count({
        conversationId,
        isDeleted: false,
      });

      const messagesByType = await this.messageRepository.aggregate([
        { $match: { conversationId: conversation._id } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        stats: {
          totalMessages,
          activeMessages,
          messagesByType,
        },
      };
    } catch (error) {
      throw new Error(`Get conversation stats failed: ${error.message}`);
    }
  }

  async searchConversations(userId, searchQuery) {
    try {
      const conversations = await this.conversationRepository.find(
        {
          participants: userId,
          $or: [{ title: { $regex: searchQuery, $options: 'i' } }],
        },
        {
          populate: ['participants'],
        }
      );

      return {
        success: true,
        conversations: conversations.map(conversation => ({
          id: conversation._id,
          participants: conversation.participants,
          type: conversation.type,
          title: conversation.title,
          isActive: conversation.isActive,
          updatedAt: conversation.updatedAt,
        })),
      };
    } catch (error) {
      throw new Error(`Search conversations failed: ${error.message}`);
    }
  }

  async getConversationTrends() {
    try {
      const trends = await this.conversationRepository.aggregate([
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
      throw new Error(`Get conversation trends failed: ${error.message}`);
    }
  }

  async getConversationRecommendations(userId) {
    try {
      // Get user's existing conversations
      const userConversations = await this.conversationRepository.find({
        participants: userId,
      });

      const existingParticipantIds = new Set();
      userConversations.forEach(conversation => {
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== userId.toString()) {
            existingParticipantIds.add(participantId.toString());
          }
        });
      });

      // Get recommended users to start conversations with
      const recommendedUsers = await this.userRepository.find(
        {
          _id: { $nin: Array.from(existingParticipantIds) },
          status: 'active',
        },
        {
          limit: 10,
          sort: { createdAt: -1 },
        }
      );

      return {
        success: true,
        recommendations: recommendedUsers.map(user => ({
          id: user._id,
          email: user.email,
          role: user.role,
        })),
      };
    } catch (error) {
      throw new Error(
        `Get conversation recommendations failed: ${error.message}`
      );
    }
  }

  async getConversationHistory(conversationId) {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messages = await this.messageRepository.find(
        { conversationId },
        { sort: { createdAt: 1 }, populate: ['senderId'] }
      );

      return {
        success: true,
        history: {
          conversation: {
            id: conversation._id,
            participants: conversation.participants,
            type: conversation.type,
            title: conversation.title,
            isActive: conversation.isActive,
            createdAt: conversation.createdAt,
          },
          messages: messages.map(message => ({
            id: message._id,
            senderId: message.senderId,
            content: message.content,
            type: message.type,
            isDeleted: message.isDeleted,
            createdAt: message.createdAt,
          })),
        },
      };
    } catch (error) {
      throw new Error(`Get conversation history failed: ${error.message}`);
    }
  }
}

module.exports = ConversationService;
