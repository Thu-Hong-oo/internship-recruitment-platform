/**
 * Message Domain Entity
 * Represents a chat message within a conversation
 *
 * Business Rules:
 * - Must belong to a conversation
 * - Must have a sender
 * - Can have attachments (images, files, etc.)
 * - Can be read by multiple users
 * - Can be edited within 5 minutes of sending
 * - Soft deletion (not physically deleted)
 * - Tracks delivery and read status
 */

const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM', // System-generated messages
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  LOCATION: 'LOCATION',
};

const MessageStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
};

class Message {
  constructor(
    id,
    conversationId,
    senderId,
    content,
    type = MessageType.TEXT,
    attachments = null,
    readBy = null,
    deliveredAt = null,
    readAt = null,
    isDeleted = false,
    deletedAt = null,
    editedAt = null,
    metadata = null,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.conversationId = conversationId;
    this.senderId = senderId;
    this.content = content || '';
    this.type = type;
    this.attachments = attachments || [];
    this.readBy = readBy || [];
    this.deliveredAt = deliveredAt;
    this.readAt = readAt;
    this.isDeleted = isDeleted;
    this.deletedAt = deletedAt;
    this.editedAt = editedAt;
    this.metadata = metadata || {};
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    if (!this.id) {
      throw new Error('Message ID is required');
    }

    if (!this.conversationId) {
      throw new Error('Conversation ID is required');
    }

    if (!this.senderId) {
      throw new Error('Sender ID is required');
    }

    if (!this.type || !Object.values(MessageType).includes(this.type)) {
      throw new Error('Valid message type is required');
    }

    // Validate type-specific rules
    if (
      this.type === MessageType.TEXT &&
      !this.content &&
      this.attachments.length === 0
    ) {
      throw new Error('Text message must have content or attachments');
    }

    if (
      [
        MessageType.IMAGE,
        MessageType.FILE,
        MessageType.AUDIO,
        MessageType.VIDEO,
      ].includes(this.type)
    ) {
      if (this.attachments.length === 0) {
        throw new Error(`${this.type} message must have attachments`);
      }
    }

    if (!Array.isArray(this.attachments)) {
      throw new Error('Attachments must be an array');
    }

    if (!Array.isArray(this.readBy)) {
      throw new Error('ReadBy must be an array');
    }
  }

  // ============================================
  // Content Management
  // ============================================

  editContent(newContent) {
    if (this.isDeleted) {
      throw new Error('Cannot edit deleted message');
    }

    if (!this.canBeEdited()) {
      throw new Error('Message can only be edited within 5 minutes of sending');
    }

    if (this.type !== MessageType.TEXT) {
      throw new Error('Only text messages can be edited');
    }

    if (!newContent || newContent.trim() === '') {
      throw new Error('Message content cannot be empty');
    }

    this.content = newContent.trim();
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  canBeEdited() {
    if (this.isDeleted) {
      return false;
    }

    if (this.type !== MessageType.TEXT) {
      return false;
    }

    // Can edit within 5 minutes of sending
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.createdAt > fiveMinutesAgo;
  }

  isEdited() {
    return this.editedAt !== null;
  }

  getEditedTimeAgo() {
    if (!this.editedAt) {
      return null;
    }

    const seconds = Math.floor((new Date() - this.editedAt) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  // ============================================
  // Attachment Management
  // ============================================

  addAttachment(url, type, size = null, name = null) {
    if (!url) {
      throw new Error('Attachment URL is required');
    }

    if (!type) {
      throw new Error('Attachment type is required');
    }

    const attachment = {
      url,
      type,
      size,
      name,
      uploadedAt: new Date(),
    };

    this.attachments.push(attachment);
    this.updatedAt = new Date();
  }

  removeAttachment(url) {
    if (!url) {
      throw new Error('Attachment URL is required');
    }

    const initialLength = this.attachments.length;
    this.attachments = this.attachments.filter(att => att.url !== url);

    if (this.attachments.length === initialLength) {
      throw new Error('Attachment not found');
    }

    this.updatedAt = new Date();
  }

  hasAttachments() {
    return this.attachments.length > 0;
  }

  getAttachmentCount() {
    return this.attachments.length;
  }

  getAttachmentsByType(type) {
    return this.attachments.filter(att => att.type === type);
  }

  getTotalAttachmentSize() {
    return this.attachments.reduce((total, att) => total + (att.size || 0), 0);
  }

  // ============================================
  // Read Status Management
  // ============================================

  markAsRead(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (this.isDeleted) {
      return; // Don't mark deleted messages as read
    }

    if (userId === this.senderId) {
      return; // Sender doesn't need to mark as read
    }

    if (this.isReadBy(userId)) {
      return; // Already marked as read
    }

    this.readBy.push(userId);

    // Set readAt timestamp on first read
    if (this.readBy.length === 1) {
      this.readAt = new Date();
    }

    this.updatedAt = new Date();
  }

  markAsUnread(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!this.isReadBy(userId)) {
      return; // Already unread
    }

    this.readBy = this.readBy.filter(id => id !== userId);

    // Clear readAt if no one has read
    if (this.readBy.length === 0) {
      this.readAt = null;
    }

    this.updatedAt = new Date();
  }

  isReadBy(userId) {
    return this.readBy.includes(userId);
  }

  getReadByCount() {
    return this.readBy.length;
  }

  isRead() {
    return this.readBy.length > 0;
  }

  // ============================================
  // Delivery Status Management
  // ============================================

  markAsDelivered() {
    if (this.deliveredAt) {
      return; // Already delivered
    }

    this.deliveredAt = new Date();
    this.updatedAt = new Date();
  }

  isDelivered() {
    return this.deliveredAt !== null;
  }

  getStatus() {
    if (this.isDeleted) {
      return 'DELETED';
    }

    if (this.readAt) {
      return MessageStatus.READ;
    }

    if (this.deliveredAt) {
      return MessageStatus.DELIVERED;
    }

    return MessageStatus.SENT;
  }

  // ============================================
  // Deletion Management (Soft Delete)
  // ============================================

  delete() {
    if (this.isDeleted) {
      throw new Error('Message is already deleted');
    }

    this.isDeleted = true;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore() {
    if (!this.isDeleted) {
      throw new Error('Message is not deleted');
    }

    this.isDeleted = false;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  canBeDeleted() {
    return !this.isDeleted;
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

  // ============================================
  // Time-based Queries
  // ============================================

  getAgeInMinutes() {
    if (!this.createdAt) {
      return 0;
    }

    return Math.floor((new Date() - this.createdAt) / (1000 * 60));
  }

  getAgeInHours() {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  isRecent(minutes = 5) {
    return this.getAgeInMinutes() < minutes;
  }

  isToday() {
    if (!this.createdAt) {
      return false;
    }

    const today = new Date();
    const messageDate = new Date(this.createdAt);

    return (
      today.getDate() === messageDate.getDate() &&
      today.getMonth() === messageDate.getMonth() &&
      today.getFullYear() === messageDate.getFullYear()
    );
  }

  // ============================================
  // Content Queries
  // ============================================

  getPreview(maxLength = 100) {
    if (this.isDeleted) {
      return 'This message was deleted';
    }

    if (this.type === MessageType.SYSTEM) {
      return this.content;
    }

    if (this.type !== MessageType.TEXT) {
      return `[${this.type}]`;
    }

    if (!this.content) {
      if (this.hasAttachments()) {
        return `[${this.attachments.length} attachment(s)]`;
      }
      return '';
    }

    if (this.content.length <= maxLength) {
      return this.content;
    }

    return this.content.substring(0, maxLength) + '...';
  }

  isTextMessage() {
    return this.type === MessageType.TEXT;
  }

  isSystemMessage() {
    return this.type === MessageType.SYSTEM;
  }

  isMediaMessage() {
    return [MessageType.IMAGE, MessageType.AUDIO, MessageType.VIDEO].includes(
      this.type
    );
  }

  isFileMessage() {
    return this.type === MessageType.FILE;
  }

  // ============================================
  // Search & Filtering
  // ============================================

  containsText(searchText) {
    if (!searchText) {
      return false;
    }

    return this.content.toLowerCase().includes(searchText.toLowerCase());
  }

  isSentBy(userId) {
    return this.senderId === userId;
  }

  // ============================================
  // Business Logic
  // ============================================

  canBeDeletedBy(userId) {
    if (this.isDeleted) {
      return false;
    }

    // Only sender can delete their own messages
    return this.senderId === userId;
  }

  canBeEditedBy(userId) {
    if (this.isDeleted) {
      return false;
    }

    // Only sender can edit their own messages
    if (this.senderId !== userId) {
      return false;
    }

    return this.canBeEdited();
  }

  shouldNotifyRecipient(userId) {
    // Don't notify sender
    if (this.senderId === userId) {
      return false;
    }

    // Don't notify for deleted messages
    if (this.isDeleted) {
      return false;
    }

    // Don't notify if already read
    if (this.isReadBy(userId)) {
      return false;
    }

    return true;
  }
}

// Export class and constants
Message.Type = MessageType;
Message.Status = MessageStatus;

module.exports = Message;
