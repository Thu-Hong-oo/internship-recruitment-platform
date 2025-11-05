/**
 * Send Message Use Case
 * Sends a message in a conversation with real-time updates
 */

class SendMessageUseCase {
  constructor(
    messageRepository,
    conversationRepository,
    userRepository,
    notificationService,
    socketService
  ) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.socketService = socketService;
  }

  async execute(senderId, conversationId, messageData) {
    try {
      // Validate conversation and sender access
      const validation = await this._validateAccess(senderId, conversationId);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Validate message data
      const messageValidation = this._validateMessageData(messageData);
      if (!messageValidation.isValid) {
        throw new Error(messageValidation.message);
      }

      // Create message
      const message = {
        conversationId,
        senderId,
        type: messageData.type || 'text',
        content: messageData.content,
        attachments: messageData.attachments || [],
        metadata: {
          edited: false,
          editHistory: [],
          replyTo: messageData.replyTo || null,
          mentions: this._extractMentions(messageData.content),
        },
        readBy: [{ userId: senderId, readAt: new Date() }],
        deliveredTo: [],
        reactions: [],
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdMessage = await this.messageRepository.create(message);

      // Update conversation
      await this._updateConversation(conversationId, createdMessage);

      // Send real-time updates
      await this._sendRealTimeUpdates(validation.conversation, createdMessage);

      // Send notifications to participants
      await this._notifyParticipants(
        validation.conversation,
        createdMessage,
        senderId
      );

      return {
        success: true,
        data: createdMessage,
        message: 'Message sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _validateAccess(senderId, conversationId) {
    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    if (!conversation) {
      return { isValid: false, message: 'Conversation not found' };
    }

    if (!conversation.participants.includes(senderId)) {
      return { isValid: false, message: 'Access denied to this conversation' };
    }

    if (
      conversation.status === 'archived' ||
      conversation.status === 'blocked'
    ) {
      return {
        isValid: false,
        message: 'Cannot send messages to this conversation',
      };
    }

    return { isValid: true, conversation };
  }

  _validateMessageData(messageData) {
    if (!messageData.content || typeof messageData.content !== 'string') {
      return { isValid: false, message: 'Message content is required' };
    }

    if (messageData.content.trim().length === 0) {
      return { isValid: false, message: 'Message content cannot be empty' };
    }

    if (messageData.content.length > 5000) {
      return {
        isValid: false,
        message: 'Message content exceeds maximum length (5000 characters)',
      };
    }

    // Validate message type
    const validTypes = ['text', 'image', 'file', 'video', 'audio', 'system'];
    if (messageData.type && !validTypes.includes(messageData.type)) {
      return { isValid: false, message: 'Invalid message type' };
    }

    // Validate attachments
    if (messageData.attachments && Array.isArray(messageData.attachments)) {
      if (messageData.attachments.length > 10) {
        return { isValid: false, message: 'Maximum 10 attachments allowed' };
      }

      for (const attachment of messageData.attachments) {
        if (!attachment.url || !attachment.type || !attachment.name) {
          return { isValid: false, message: 'Invalid attachment format' };
        }
      }
    }

    return { isValid: true };
  }

  _extractMentions(content) {
    // Extract @username mentions from message content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  async _updateConversation(conversationId, message) {
    const updateData = {
      lastMessage: {
        content: message.content,
        senderId: message.senderId,
        type: message.type,
        createdAt: message.createdAt,
      },
      lastMessageAt: message.createdAt,
      messageCount: { $inc: 1 },
      updatedAt: new Date(),
    };

    // Update unread counts for all participants except sender
    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    const unreadCounts = { ...conversation.unreadCounts };

    conversation.participants.forEach(participantId => {
      if (participantId !== message.senderId) {
        unreadCounts[participantId] = (unreadCounts[participantId] || 0) + 1;
      }
    });

    updateData.unreadCounts = unreadCounts;

    await this.conversationRepository.update(conversationId, updateData);
  }

  async _sendRealTimeUpdates(conversation, message) {
    try {
      // Send message to all conversation participants
      conversation.participants.forEach(participantId => {
        this.socketService.sendToUser(participantId, 'new_message', {
          conversationId: conversation._id,
          message: message,
        });
      });

      // Send typing indicator stop
      this.socketService.sendToRoom(
        `conversation_${conversation._id}`,
        'user_stopped_typing',
        {
          userId: message.senderId,
          conversationId: conversation._id,
        }
      );
    } catch (error) {
      console.error('Failed to send real-time updates:', error);
      // Don't fail message sending for real-time errors
    }
  }

  async _notifyParticipants(conversation, message, senderId) {
    try {
      const sender = await this.userRepository.findById(senderId);
      const otherParticipants = conversation.participants.filter(
        id => id !== senderId
      );

      const notifications = otherParticipants.map(participantId => ({
        userId: participantId,
        type: 'new_message',
        title: `New message from ${sender.fullName}`,
        message: this._truncateMessage(message.content),
        data: {
          conversationId: conversation._id,
          messageId: message._id,
          senderId: senderId,
        },
        priority: 'normal',
      }));

      await this.notificationService.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Failed to send message notifications:', error);
      // Don't fail message sending for notification errors
    }
  }

  _truncateMessage(content, maxLength = 100) {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
}

module.exports = SendMessageUseCase;
