/**
 * Get Messages Use Case
 * Retrieves messages from a conversation with pagination and filtering
 */

class GetMessagesUseCase {
  constructor(messageRepository, conversationRepository, userRepository) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
    this.userRepository = userRepository;
  }

  async execute(userId, conversationId, options = {}) {
    try {
      // Validate conversation access
      const validation = await this._validateAccess(userId, conversationId);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Build filter criteria
      const filter = this._buildFilter(conversationId, options);

      // Build sort criteria (newest first by default for chat)
      const sort = this._buildSort(options.sortBy);

      // Build pagination
      const pagination = this._buildPagination(options);

      // Get messages
      const messages = await this.messageRepository.find(
        filter,
        sort,
        pagination
      );

      // Enrich messages with sender details and read status
      const enrichedMessages = await this._enrichMessages(messages, userId);

      // Get total count for pagination
      const totalCount = await this.messageRepository.count(filter);

      // Calculate pagination metadata
      const pageInfo = this._calculatePageInfo(pagination, totalCount);

      return {
        success: true,
        data: {
          messages: enrichedMessages,
          pagination: pageInfo,
          summary: {
            total: totalCount,
            unread: enrichedMessages.filter(
              msg => !this._isMessageReadByUser(msg, userId)
            ).length,
          },
        },
        message: 'Messages retrieved successfully',
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

  _buildFilter(conversationId, options) {
    const filter = { conversationId };

    // Filter by message type
    if (options.type) {
      const validTypes = ['text', 'image', 'file', 'video', 'audio', 'system'];
      if (validTypes.includes(options.type)) {
        filter.type = options.type;
      }
    }

    // Filter by sender
    if (options.senderId) {
      filter.senderId = options.senderId;
    }

    // Filter by date range
    if (options.dateFrom || options.dateTo) {
      filter.createdAt = {};
      if (options.dateFrom) {
        filter.createdAt.$gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        filter.createdAt.$lte = new Date(options.dateTo);
      }
    }

    // Search in message content
    if (options.search) {
      filter.content = { $regex: options.search, $options: 'i' };
    }

    // Filter messages after a specific message (for loading older messages)
    if (options.after) {
      filter._id = { $gt: options.after };
    }

    // Filter messages before a specific message (for loading newer messages)
    if (options.before) {
      filter._id = { $lt: options.before };
    }

    // Filter by attachment presence
    if (options.hasAttachments === true) {
      filter['attachments.0'] = { $exists: true };
    } else if (options.hasAttachments === false) {
      filter.attachments = { $size: 0 };
    }

    // Filter by read status for current user
    if (options.unreadOnly === true) {
      filter['readBy.userId'] = { $ne: options.userId };
    }

    return filter;
  }

  _buildSort(sortBy) {
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      relevance: { score: { $meta: 'textScore' }, createdAt: -1 }, // For text search
    };

    return sortOptions[sortBy] || sortOptions.newest;
  }

  _buildPagination(options) {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 50));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  async _enrichMessages(messages, currentUserId) {
    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(msg => msg.senderId))];
    const senders = await this.userRepository.findByIds(senderIds);
    const senderMap = new Map(senders.map(user => [user._id.toString(), user]));

    const enriched = messages.map(message => {
      const sender = senderMap.get(message.senderId.toString());
      const isReadByCurrentUser = this._isMessageReadByUser(
        message,
        currentUserId
      );
      const isOwnMessage =
        message.senderId.toString() === currentUserId.toString();

      return {
        _id: message._id,
        conversationId: message.conversationId,
        type: message.type,
        content: message.content,
        attachments: message.attachments,
        metadata: {
          ...message.metadata,
          isEdited: message.metadata.edited || false,
          replyTo: message.metadata.replyTo,
        },
        sender: sender
          ? {
              _id: sender._id,
              fullName: sender.fullName,
              avatar: sender.avatar,
              role: sender.role,
            }
          : null,
        readBy: message.readBy,
        reactions: message.reactions,
        status: message.status,
        isReadByMe: isReadByCurrentUser,
        isOwnMessage: isOwnMessage,
        deliveredTo: message.deliveredTo,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    });

    return enriched;
  }

  _isMessageReadByUser(message, userId) {
    return message.readBy.some(
      read => read.userId.toString() === userId.toString()
    );
  }

  _calculatePageInfo(pagination, totalCount) {
    const totalPages = Math.ceil(totalCount / pagination.limit);
    const hasNextPage = pagination.page < totalPages;
    const hasPreviousPage = pagination.page > 1;

    return {
      currentPage: pagination.page,
      totalPages,
      totalCount,
      limit: pagination.limit,
      hasNextPage,
      hasPreviousPage,
    };
  }

  // Helper method to get thread messages (replies to a specific message)
  async getMessageThread(
    userId,
    conversationId,
    parentMessageId,
    options = {}
  ) {
    try {
      // Validate access to conversation
      const validation = await this._validateAccess(userId, conversationId);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Find the parent message
      const parentMessage = await this.messageRepository.findById(
        parentMessageId
      );
      if (
        !parentMessage ||
        parentMessage.conversationId.toString() !== conversationId
      ) {
        throw new Error('Parent message not found');
      }

      // Get all replies to this message
      const filter = {
        conversationId,
        'metadata.replyTo': parentMessageId,
      };

      const sort = { createdAt: 1 }; // Chronological order for threads
      const pagination = this._buildPagination(options);

      const threadMessages = await this.messageRepository.find(
        filter,
        sort,
        pagination
      );
      const enrichedThread = await this._enrichMessages(threadMessages, userId);

      return {
        success: true,
        data: {
          parentMessage: (
            await this._enrichMessages([parentMessage], userId)
          )[0],
          replies: enrichedThread,
          pagination: this._calculatePageInfo(
            pagination,
            threadMessages.length
          ),
        },
        message: 'Thread messages retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = GetMessagesUseCase;
