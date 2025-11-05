/**
 * Conversation Domain Entity
 * Represents a chat conversation between multiple participants
 *
 * Business Rules:
 * - Must have at least 2 participants
 * - Can be associated with a job posting or application
 * - Tracks last message for quick preview
 * - Can be archived but not deleted
 * - Supports group conversations (>2 participants)
 */

const ConversationType = {
  DIRECT: 'DIRECT', // 1-on-1 conversation
  GROUP: 'GROUP', // Multiple participants
  JOB_APPLICATION: 'JOB_APPLICATION', // Related to job application
  SUPPORT: 'SUPPORT', // Customer support
};

const ConversationStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  CLOSED: 'CLOSED',
};

class Conversation {
  constructor(
    id,
    type,
    participants,
    status = ConversationStatus.ACTIVE,
    jobId = null,
    applicationId = null,
    lastMessage = null,
    metadata = null,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.type = type;
    this.participants = participants || [];
    this.status = status;
    this.jobId = jobId;
    this.applicationId = applicationId;
    this.lastMessage = lastMessage;
    this.metadata = metadata || {};
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    if (!this.id) {
      throw new Error('Conversation ID is required');
    }

    if (!this.type || !Object.values(ConversationType).includes(this.type)) {
      throw new Error('Valid conversation type is required');
    }

    if (
      !this.status ||
      !Object.values(ConversationStatus).includes(this.status)
    ) {
      throw new Error('Valid conversation status is required');
    }

    if (!Array.isArray(this.participants)) {
      throw new Error('Participants must be an array');
    }

    if (this.participants.length < 2) {
      throw new Error('Conversation must have at least 2 participants');
    }

    // Validate type-specific rules
    if (this.type === ConversationType.DIRECT && this.participants.length > 2) {
      throw new Error('Direct conversation can only have 2 participants');
    }

    if (this.type === ConversationType.JOB_APPLICATION) {
      if (!this.jobId) {
        throw new Error('Job application conversation must have a jobId');
      }
      if (!this.applicationId) {
        throw new Error(
          'Job application conversation must have an applicationId'
        );
      }
    }
  }

  // ============================================
  // Participant Management
  // ============================================

  addParticipant(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (this.type === ConversationType.DIRECT) {
      throw new Error('Cannot add participants to direct conversation');
    }

    if (this.hasParticipant(userId)) {
      throw new Error('User is already a participant');
    }

    if (this.status !== ConversationStatus.ACTIVE) {
      throw new Error('Cannot add participants to non-active conversation');
    }

    this.participants.push(userId);
    this.updatedAt = new Date();
  }

  removeParticipant(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (this.type === ConversationType.DIRECT) {
      throw new Error('Cannot remove participants from direct conversation');
    }

    if (!this.hasParticipant(userId)) {
      throw new Error('User is not a participant');
    }

    this.participants = this.participants.filter(id => id !== userId);
    this.updatedAt = new Date();

    // Archive if less than 2 participants remain
    if (this.participants.length < 2) {
      this.archive();
    }
  }

  hasParticipant(userId) {
    return this.participants.includes(userId);
  }

  getParticipantCount() {
    return this.participants.length;
  }

  isGroupConversation() {
    return this.type === ConversationType.GROUP && this.participants.length > 2;
  }

  // ============================================
  // Last Message Management
  // ============================================

  updateLastMessage(messageId, content, senderId, sentAt) {
    if (!messageId || !senderId) {
      throw new Error('Message ID and sender ID are required');
    }

    this.lastMessage = {
      messageId,
      content: content || '',
      senderId,
      sentAt: sentAt || new Date(),
    };
    this.updatedAt = new Date();
  }

  clearLastMessage() {
    this.lastMessage = null;
    this.updatedAt = new Date();
  }

  getLastMessagePreview(maxLength = 50) {
    if (!this.lastMessage || !this.lastMessage.content) {
      return '';
    }

    const content = this.lastMessage.content;
    if (content.length <= maxLength) {
      return content;
    }

    return content.substring(0, maxLength) + '...';
  }

  hasMessages() {
    return this.lastMessage !== null;
  }

  // ============================================
  // Status Management
  // ============================================

  archive() {
    if (this.status === ConversationStatus.CLOSED) {
      throw new Error('Cannot archive closed conversation');
    }

    this.status = ConversationStatus.ARCHIVED;
    this.updatedAt = new Date();
  }

  unarchive() {
    if (this.status !== ConversationStatus.ARCHIVED) {
      throw new Error('Only archived conversations can be unarchived');
    }

    this.status = ConversationStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  close() {
    if (this.status === ConversationStatus.CLOSED) {
      throw new Error('Conversation is already closed');
    }

    this.status = ConversationStatus.CLOSED;
    this.updatedAt = new Date();
  }

  reopen() {
    if (this.status !== ConversationStatus.CLOSED) {
      throw new Error('Only closed conversations can be reopened');
    }

    this.status = ConversationStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  isActive() {
    return this.status === ConversationStatus.ACTIVE;
  }

  isArchived() {
    return this.status === ConversationStatus.ARCHIVED;
  }

  isClosed() {
    return this.status === ConversationStatus.CLOSED;
  }

  // ============================================
  // Metadata Management
  // ============================================

  setMetadata(key, value) {
    if (!key) {
      throw new Error('Metadata key is required');
    }

    if (!this.metadata) {
      this.metadata = {};
    }

    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  getMetadata(key) {
    if (!this.metadata) {
      return null;
    }

    return this.metadata[key] || null;
  }

  clearMetadata() {
    this.metadata = {};
    this.updatedAt = new Date();
  }

  // ============================================
  // Context Information
  // ============================================

  isRelatedToJob() {
    return this.jobId !== null;
  }

  isRelatedToApplication() {
    return this.applicationId !== null;
  }

  getContext() {
    return {
      type: this.type,
      isGroupConversation: this.isGroupConversation(),
      participantCount: this.getParticipantCount(),
      hasJob: this.isRelatedToJob(),
      hasApplication: this.isRelatedToApplication(),
      status: this.status,
    };
  }

  // ============================================
  // Business Logic Queries
  // ============================================

  canUserSendMessage(userId) {
    if (!this.hasParticipant(userId)) {
      return false;
    }

    if (this.status === ConversationStatus.CLOSED) {
      return false;
    }

    return true;
  }

  canUserAddParticipants(userId) {
    if (!this.hasParticipant(userId)) {
      return false;
    }

    if (this.type === ConversationType.DIRECT) {
      return false;
    }

    if (this.status !== ConversationStatus.ACTIVE) {
      return false;
    }

    return true;
  }

  canUserArchive(userId) {
    if (!this.hasParticipant(userId)) {
      return false;
    }

    if (this.status !== ConversationStatus.ACTIVE) {
      return false;
    }

    return true;
  }

  shouldNotifyParticipants(excludeUserId = null) {
    if (this.status !== ConversationStatus.ACTIVE) {
      return false;
    }

    return true;
  }

  getNotificationRecipients(excludeUserId = null) {
    if (!this.shouldNotifyParticipants()) {
      return [];
    }

    if (!excludeUserId) {
      return [...this.participants];
    }

    return this.participants.filter(id => id !== excludeUserId);
  }
}

// Export class and constants
Conversation.Type = ConversationType;
Conversation.Status = ConversationStatus;

module.exports = Conversation;
