/**
 * Get Conversations Use Case
 * Retrieves user's conversations with filtering and pagination
 */

class GetConversationsUseCase {
  constructor(conversationRepository, userRepository) {
    this.conversationRepository = conversationRepository;
    this.userRepository = userRepository;
  }

  async execute(userId, options = {}) {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build filter criteria
      const filter = this._buildFilter(userId, options);

      // Build sort criteria
      const sort = this._buildSort(options.sortBy);

      // Build pagination
      const pagination = this._buildPagination(options);

      // Get conversations
      const conversations = await this.conversationRepository.findByUser(
        userId,
        filter,
        sort,
        pagination
      );

      // Enrich conversations with participant details
      const enrichedConversations = await this._enrichConversations(
        conversations,
        userId
      );

      // Get total count for pagination
      const totalCount = await this.conversationRepository.countByUser(
        userId,
        filter
      );

      // Calculate pagination metadata
      const pageInfo = this._calculatePageInfo(pagination, totalCount);

      return {
        success: true,
        data: {
          conversations: enrichedConversations,
          pagination: pageInfo,
          summary: {
            total: totalCount,
            unread: enrichedConversations.filter(conv => conv.unreadCount > 0)
              .length,
            active: enrichedConversations.filter(
              conv => conv.status === 'active'
            ).length,
          },
        },
        message: 'Conversations retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _buildFilter(userId, options) {
    const filter = {};

    // Filter by conversation type
    if (options.type) {
      const validTypes = ['candidate-employer', 'peer-to-peer', 'group'];
      if (validTypes.includes(options.type)) {
        filter.type = options.type;
      }
    }

    // Filter by status
    if (options.status) {
      const validStatuses = ['active', 'archived', 'muted'];
      if (validStatuses.includes(options.status)) {
        filter.status = options.status;
      }
    }

    // Filter by unread messages
    if (options.unreadOnly === true) {
      filter[`unreadCounts.${userId}`] = { $gt: 0 };
    }

    // Filter by date range
    if (options.dateFrom || options.dateTo) {
      filter.lastMessageAt = {};
      if (options.dateFrom) {
        filter.lastMessageAt.$gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        filter.lastMessageAt.$lte = new Date(options.dateTo);
      }
    }

    // Filter by job context
    if (options.jobId) {
      filter['metadata.jobId'] = options.jobId;
    }

    // Search in conversation titles or participant names
    if (options.search) {
      filter.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        // Note: Searching participant names would require a lookup
      ];
    }

    return filter;
  }

  _buildSort(sortBy) {
    const sortOptions = {
      recent: { lastMessageAt: -1, updatedAt: -1 },
      oldest: { lastMessageAt: 1, updatedAt: 1 },
      alphabetical: { title: 1 },
      unread: {
        [`unreadCounts.${userId}`]: -1,
        lastMessageAt: -1,
      },
    };

    return sortOptions[sortBy] || sortOptions.recent;
  }

  _buildPagination(options) {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(options.limit) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  async _enrichConversations(conversations, userId) {
    const enriched = [];

    for (const conversation of conversations) {
      // Get other participants (exclude current user)
      const otherParticipantIds = conversation.participants.filter(
        id => id !== userId
      );
      const otherParticipants = await this.userRepository.findByIds(
        otherParticipantIds
      );

      // Calculate display name and avatar
      const displayInfo = this._calculateDisplayInfo(
        conversation,
        otherParticipants
      );

      // Get unread count for current user
      const unreadCount = conversation.unreadCounts[userId] || 0;

      // Determine conversation status for this user
      const userStatus = this._getUserConversationStatus(conversation, userId);

      enriched.push({
        _id: conversation._id,
        title: displayInfo.title,
        avatar: displayInfo.avatar,
        type: conversation.type,
        status: userStatus,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount,
        messageCount: conversation.messageCount,
        participants: otherParticipants.map(p => ({
          _id: p._id,
          fullName: p.fullName,
          avatar: p.avatar,
          role: p.role,
          isOnline: p.isOnline || false,
        })),
        metadata: conversation.metadata,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      });
    }

    return enriched;
  }

  _calculateDisplayInfo(conversation, otherParticipants) {
    if (conversation.title && conversation.title !== 'Untitled') {
      return {
        title: conversation.title,
        avatar: null, // Group conversations might have custom avatars
      };
    }

    if (otherParticipants.length === 1) {
      return {
        title: otherParticipants[0].fullName,
        avatar: otherParticipants[0].avatar,
      };
    }

    if (otherParticipants.length <= 3) {
      return {
        title: otherParticipants.map(p => p.fullName).join(', '),
        avatar: null,
      };
    }

    return {
      title: `${otherParticipants[0].fullName} and ${
        otherParticipants.length - 1
      } others`,
      avatar: null,
    };
  }

  _getUserConversationStatus(conversation, userId) {
    // Check if user has muted this conversation
    if (conversation.mutedBy && conversation.mutedBy.includes(userId)) {
      return 'muted';
    }

    // Check if user has archived this conversation
    if (conversation.archivedBy && conversation.archivedBy.includes(userId)) {
      return 'archived';
    }

    return conversation.status || 'active';
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
}

module.exports = GetConversationsUseCase;
