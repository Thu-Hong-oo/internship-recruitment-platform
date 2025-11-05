/**
 * Mark Messages As Read Use Case
 * Marks messages as read and updates conversation unread counts
 */

class MarkMessagesAsReadUseCase {
  constructor(messageRepository, conversationRepository, socketService) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
    this.socketService = socketService;
  }

  async execute(userId, conversationId, messageIds = null) {
    try {
      // Validate conversation access
      const validation = await this._validateAccess(userId, conversationId);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      const conversation = validation.conversation;

      // Determine which messages to mark as read
      let messagesToUpdate;
      if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
        // Mark specific messages as read
        messagesToUpdate = await this._getSpecificMessages(
          conversationId,
          messageIds,
          userId
        );
      } else {
        // Mark all unread messages in conversation as read
        messagesToUpdate = await this._getAllUnreadMessages(
          conversationId,
          userId
        );
      }

      if (messagesToUpdate.length === 0) {
        return {
          success: true,
          data: { markedCount: 0 },
          message: 'No messages to mark as read',
        };
      }

      // Update messages with read status
      const updateResult = await this._updateMessagesReadStatus(
        messagesToUpdate,
        userId
      );

      // Update conversation unread count
      await this._updateConversationUnreadCount(conversationId, userId);

      // Send real-time updates
      await this._sendRealTimeUpdates(conversation, userId, messagesToUpdate);

      return {
        success: true,
        data: {
          markedCount: updateResult.modifiedCount,
          messageIds: messagesToUpdate.map(msg => msg._id),
        },
        message: `${updateResult.modifiedCount} messages marked as read`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _validateAccess(userId, conversationId) {
    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    if (!conversation) {
      return { isValid: false, message: 'Conversation not found' };
    }

    if (!conversation.participants.includes(userId)) {
      return { isValid: false, message: 'Access denied to this conversation' };
    }

    return { isValid: true, conversation };
  }

  async _getSpecificMessages(conversationId, messageIds, userId) {
    // Validate message IDs
    if (messageIds.length > 100) {
      throw new Error('Cannot mark more than 100 messages at once');
    }

    // Find messages that exist and user hasn't read yet
    const messages = await this.messageRepository.findByIds(messageIds, {
      conversationId,
      'readBy.userId': { $ne: userId }, // Not already read by this user
    });

    return messages;
  }

  async _getAllUnreadMessages(conversationId, userId) {
    // Find all messages in conversation that user hasn't read
    const messages = await this.messageRepository.find({
      conversationId,
      senderId: { $ne: userId }, // Don't include messages sent by this user
      'readBy.userId': { $ne: userId }, // Not already read by this user
    });

    return messages;
  }

  async _updateMessagesReadStatus(messages, userId) {
    const messageIds = messages.map(msg => msg._id);
    const readTimestamp = new Date();

    // Bulk update messages to add read status
    const updateResult = await this.messageRepository.updateMany(
      { _id: { $in: messageIds } },
      {
        $addToSet: {
          readBy: {
            userId: userId,
            readAt: readTimestamp,
          },
        },
        $set: {
          updatedAt: readTimestamp,
        },
      }
    );

    return updateResult;
  }

  async _updateConversationUnreadCount(conversationId, userId) {
    // Reset unread count for this user to 0
    const updateData = {
      [`unreadCounts.${userId}`]: 0,
      updatedAt: new Date(),
    };

    await this.conversationRepository.update(conversationId, updateData);
  }

  async _sendRealTimeUpdates(conversation, userId, markedMessages) {
    try {
      const readData = {
        conversationId: conversation._id,
        userId: userId,
        messageIds: markedMessages.map(msg => msg._id),
        readAt: new Date(),
      };

      // Notify all participants that messages were read
      conversation.participants.forEach(participantId => {
        this.socketService.sendToUser(participantId, 'messages_read', readData);
      });

      // Send conversation update (for unread count change)
      this.socketService.sendToUser(userId, 'conversation_updated', {
        conversationId: conversation._id,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Failed to send read status updates:', error);
      // Don't fail the operation for real-time errors
    }
  }

  // Helper method to mark all conversations as read for a user
  async markAllConversationsAsRead(userId) {
    try {
      // Get all conversations for user
      const conversations = await this.conversationRepository.findByUser(
        userId,
        {},
        {},
        { limit: 1000 }
      );

      const results = [];
      for (const conversation of conversations) {
        const result = await this.execute(userId, conversation._id);
        results.push({
          conversationId: conversation._id,
          success: result.success,
          markedCount: result.data?.markedCount || 0,
        });
      }

      const totalMarked = results.reduce(
        (sum, result) => sum + (result.markedCount || 0),
        0
      );

      return {
        success: true,
        data: {
          totalMarked,
          conversationResults: results,
        },
        message: `Marked ${totalMarked} messages as read across ${results.length} conversations`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = MarkMessagesAsReadUseCase;
