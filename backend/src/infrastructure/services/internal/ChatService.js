/**
 * ChatService - Handles chat and messaging operations
 * Dependencies injected via constructor for proper DI
 */
class ChatService {
  constructor(
    conversationRepository,
    messageRepository,
    userRepository,
    validationService,
    socketService
  ) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
    this.userRepository = userRepository;
    this.validationService = validationService;
    this.socketService = socketService;
  }

  async createConversation(userId, conversationData) {
    try {
      const {
        participantId,
        type = 'direct',
        metadata = {},
      } = conversationData;

      // Check if conversation already exists
      const existingConversation = await this.conversationRepository.findOne({
        $or: [
          { participants: [userId, participantId] },
          { participants: [participantId, userId] },
        ],
        type: 'direct',
      });

      if (existingConversation) {
        return {
          success: true,
          conversation: {
            id: existingConversation._id,
            type: existingConversation.type,
            participants: existingConversation.participants,
            createdAt: existingConversation.createdAt,
          },
          message: 'Conversation already exists',
        };
      }

      // Create new conversation
      const conversation = await this.conversationRepository.create({
        participants: [userId, participantId],
        type,
        metadata,
        createdBy: userId,
      });

      return {
        success: true,
        conversation: {
          id: conversation._id,
          type: conversation.type,
          participants: conversation.participants,
          createdAt: conversation.createdAt,
        },
        message: 'Conversation created successfully',
      };
    } catch (error) {
      throw new Error(`Create conversation failed: ${error.message}`);
    }
  }

  async getUserConversations(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, type } = filters;
      const skip = (page - 1) * limit;

      const query = { participants: userId };
      if (type) query.type = type;

      const conversations = await this.conversationRepository.find(query, {
        skip,
        limit,
        sort: { updatedAt: -1 },
        populate: ['participants', 'lastMessage'],
      });

      const total = await this.conversationRepository.count(query);

      return {
        success: true,
        conversations: conversations.map(conv => ({
          id: conv._id,
          type: conv.type,
          participants: conv.participants,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount || 0,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
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

  async getConversationById(conversationId, userId) {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId,
        ['participants', 'lastMessage']
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if user is participant
      if (!conversation.participants.includes(userId)) {
        throw new Error('Access denied');
      }

      return {
        success: true,
        conversation: {
          id: conversation._id,
          type: conversation.type,
          participants: conversation.participants,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount || 0,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get conversation by ID failed: ${error.message}`);
    }
  }

  async sendMessage(conversationId, senderId, messageData) {
    try {
      const { content, type = 'text', metadata = {} } = messageData;

      // Verify conversation access
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation || !conversation.participants.includes(senderId)) {
        throw new Error('Conversation not found or access denied');
      }

      // Create message
      const message = await this.messageRepository.create({
        conversationId,
        senderId,
        content,
        type,
        metadata,
        sentAt: new Date(),
      });

      // Update conversation last message and timestamp
      await this.conversationRepository.update(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

      // Send real-time notification
      const otherParticipants = conversation.participants.filter(
        id => id !== senderId
      );
      otherParticipants.forEach(participantId => {
        SocketService.sendToUser(participantId, 'new-message', {
          id: message._id,
          conversationId,
          senderId,
          content,
          type,
          sentAt: message.sentAt,
        });
      });

      return {
        success: true,
        message: {
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          sentAt: message.sentAt,
        },
        message: 'Message sent successfully',
      };
    } catch (error) {
      throw new Error(`Send message failed: ${error.message}`);
    }
  }

  async getConversationMessages(conversationId, userId, filters = {}) {
    try {
      const { page = 1, limit = 50 } = filters;
      const skip = (page - 1) * limit;

      // Verify conversation access
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation || !conversation.participants.includes(userId)) {
        throw new Error('Conversation not found or access denied');
      }

      const messages = await this.messageRepository.find(
        { conversationId, isDeleted: false },
        {
          skip,
          limit,
          sort: { sentAt: -1 },
          populate: ['senderId'],
        }
      );

      const total = await this.messageRepository.count({
        conversationId,
        isDeleted: false,
      });

      return {
        success: true,
        messages: messages.map(msg => ({
          id: msg._id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          sentAt: msg.sentAt,
          editedAt: msg.editedAt,
          sender: msg.senderId,
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

  async markMessagesAsRead(conversationId, userId) {
    try {
      // Verify conversation access
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation || !conversation.participants.includes(userId)) {
        throw new Error('Conversation not found or access denied');
      }

      // Mark all messages in conversation as read for this user
      await this.messageRepository.updateMany(
        { conversationId, senderId: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );

      return {
        success: true,
        message: 'Messages marked as read',
      };
    } catch (error) {
      throw new Error(`Mark messages as read failed: ${error.message}`);
    }
  }

  async deleteMessage(messageId, userId) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user is the sender
      if (message.senderId.toString() !== userId) {
        throw new Error('Access denied');
      }

      // Check if message can be deleted
      if (!message.canDelete()) {
        throw new Error('Message cannot be deleted');
      }

      // Soft delete message
      await this.messageRepository.update(messageId, { isDeleted: true });

      return {
        success: true,
        message: 'Message deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete message failed: ${error.message}`);
    }
  }

  async editMessage(messageId, userId, messageData) {
    try {
      const { content } = messageData;

      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user is the sender
      if (message.senderId.toString() !== userId) {
        throw new Error('Access denied');
      }

      // Check if message can be edited
      if (!message.canEdit()) {
        throw new Error('Message cannot be edited');
      }

      // Update message
      const updatedMessage = await this.messageRepository.update(messageId, {
        content,
        editedAt: new Date(),
      });

      return {
        success: true,
        message: {
          id: updatedMessage._id,
          content: updatedMessage.content,
          editedAt: updatedMessage.editedAt,
        },
        message: 'Message edited successfully',
      };
    } catch (error) {
      throw new Error(`Edit message failed: ${error.message}`);
    }
  }

  async getUnreadMessageCount(userId) {
    try {
      // Get user's conversations
      const conversations = await this.conversationRepository.find({
        participants: userId,
      });

      const conversationIds = conversations.map(conv => conv._id);

      // Count unread messages
      const unreadCount = await this.messageRepository.count({
        conversationId: { $in: conversationIds },
        senderId: { $ne: userId },
        readBy: { $ne: userId },
        isDeleted: false,
      });

      return {
        success: true,
        unreadCount,
      };
    } catch (error) {
      throw new Error(`Get unread message count failed: ${error.message}`);
    }
  }

  async archiveConversation(conversationId, userId) {
    try {
      // Verify conversation access
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation || !conversation.participants.includes(userId)) {
        throw new Error('Conversation not found or access denied');
      }

      // Archive conversation
      const updatedConversation = await this.conversationRepository.update(
        conversationId,
        {
          archivedBy: userId,
          archivedAt: new Date(),
        }
      );

      return {
        success: true,
        conversation: {
          id: updatedConversation._id,
          archivedAt: updatedConversation.archivedAt,
        },
        message: 'Conversation archived successfully',
      };
    } catch (error) {
      throw new Error(`Archive conversation failed: ${error.message}`);
    }
  }

  async unarchiveConversation(conversationId, userId) {
    try {
      // Verify conversation access
      const conversation = await this.conversationRepository.findById(
        conversationId
      );
      if (!conversation || !conversation.participants.includes(userId)) {
        throw new Error('Conversation not found or access denied');
      }

      // Unarchive conversation
      const updatedConversation = await this.conversationRepository.update(
        conversationId,
        {
          $unset: { archivedBy: 1, archivedAt: 1 },
        }
      );

      return {
        success: true,
        conversation: {
          id: updatedConversation._id,
        },
        message: 'Conversation unarchived successfully',
      };
    } catch (error) {
      throw new Error(`Unarchive conversation failed: ${error.message}`);
    }
  }
}

module.exports = ChatService;
