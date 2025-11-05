/**
 * Create Conversation Use Case
 * Creates a new conversation between users (candidate-employer, peer-to-peer)
 */

class CreateConversationUseCase {
  constructor(conversationRepository, userRepository, notificationService) {
    this.conversationRepository = conversationRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
  }

  async execute(initiatorId, participantIds, conversationData = {}) {
    try {
      // Validate participants
      const allParticipants = [initiatorId, ...participantIds];
      const validation = await this._validateParticipants(allParticipants);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Check for existing conversation between these participants
      const existingConversation = await this._findExistingConversation(
        allParticipants
      );
      if (existingConversation) {
        return {
          success: true,
          data: existingConversation,
          message: 'Conversation already exists',
        };
      }

      // Create conversation
      const conversation = {
        participants: allParticipants,
        initiatorId,
        type: this._determineConversationType(
          allParticipants,
          validation.users
        ),
        title:
          conversationData.title ||
          this._generateConversationTitle(validation.users),
        metadata: {
          jobId: conversationData.jobId || null,
          applicationId: conversationData.applicationId || null,
          context: conversationData.context || null,
        },
        status: 'active',
        lastMessage: null,
        lastMessageAt: null,
        messageCount: 0,
        unreadCounts: allParticipants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdConversation = await this.conversationRepository.create(
        conversation
      );

      // Send notifications to participants (except initiator)
      await this._notifyParticipants(
        participantIds,
        createdConversation,
        validation.users
      );

      return {
        success: true,
        data: createdConversation,
        message: 'Conversation created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _validateParticipants(participantIds) {
    if (!Array.isArray(participantIds) || participantIds.length < 2) {
      return { isValid: false, message: 'At least 2 participants required' };
    }

    if (participantIds.length > 10) {
      return { isValid: false, message: 'Maximum 10 participants allowed' };
    }

    // Remove duplicates
    const uniqueParticipants = [...new Set(participantIds)];
    if (uniqueParticipants.length !== participantIds.length) {
      return { isValid: false, message: 'Duplicate participants not allowed' };
    }

    // Verify all participants exist
    const users = await this.userRepository.findByIds(uniqueParticipants);
    if (users.length !== uniqueParticipants.length) {
      return { isValid: false, message: 'One or more participants not found' };
    }

    // Check if users are active
    const inactiveUsers = users.filter(user => user.status !== 'active');
    if (inactiveUsers.length > 0) {
      return { isValid: false, message: 'Some participants are inactive' };
    }

    return { isValid: true, users };
  }

  async _findExistingConversation(participantIds) {
    // Sort participant IDs for consistent lookup
    const sortedParticipants = participantIds.sort();

    return await this.conversationRepository.findByParticipants(
      sortedParticipants
    );
  }

  _determineConversationType(participantIds, users) {
    if (participantIds.length === 2) {
      const userRoles = users.map(user => user.role);
      if (userRoles.includes('candidate') && userRoles.includes('employer')) {
        return 'candidate-employer';
      }
      return 'peer-to-peer';
    }
    return 'group';
  }

  _generateConversationTitle(users) {
    if (users.length === 2) {
      return `${users[0].fullName} & ${users[1].fullName}`;
    }

    if (users.length <= 4) {
      return users.map(user => user.fullName).join(', ');
    }

    return `${users[0].fullName} and ${users.length - 1} others`;
  }

  async _notifyParticipants(participantIds, conversation, users) {
    try {
      const notifications = participantIds.map(participantId => ({
        userId: participantId,
        type: 'new_conversation',
        title: 'New Conversation',
        message: `You have been added to a new conversation: ${conversation.title}`,
        data: {
          conversationId: conversation._id,
          type: conversation.type,
        },
        priority: 'normal',
      }));

      await this.notificationService.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Failed to send conversation notifications:', error);
      // Don't fail the conversation creation for notification errors
    }
  }
}

module.exports = CreateConversationUseCase;
