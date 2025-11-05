const NotificationType = require('./enums/NotificationType');
const PriorityLevel = require('./enums/PriorityLevel');

/**
 * Notification Domain Entity
 *
 * Represents a notification sent to a user in the recruitment system.
 * Contains notification content, type, priority, and read status.
 *
 * Following Clean Architecture principles:
 * - No dependencies on infrastructure layer
 * - Business logic encapsulated within entity
 * - Constructor accepts only required fields
 * - Optional fields set to null (not undefined)
 * - No default values in constructor
 */
class Notification {
  constructor(
    notificationId,
    userId,
    type,
    title,
    message,
    actionUrl = null,
    relatedJobId = null,
    relatedApplicationId = null,
    isRead = false,
    priority = PriorityLevel.LOW,
    expiresAt = null,
    createdAt = null,
    updatedAt = null
  ) {
    // Required fields
    this.notificationId = notificationId;
    this.userId = userId;
    this.type = type;
    this.title = title;
    this.message = message;

    // Optional fields
    this.actionUrl = actionUrl;
    this.relatedJobId = relatedJobId;
    this.relatedApplicationId = relatedApplicationId;

    // Status
    this.isRead = isRead;
    this.priority = priority;
    this.expiresAt = expiresAt;

    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validates the notification entity
   * @throws {Error} if validation fails
   */
  validate() {
    if (!this.userId) {
      throw new Error('User ID is required for notification');
    }

    if (!this.type) {
      throw new Error('Notification type is required');
    }

    const validTypes = Object.values(NotificationType);
    if (!validTypes.includes(this.type)) {
      throw new Error(`Invalid notification type: ${this.type}`);
    }

    const validPriorities = Object.values(PriorityLevel);
    if (!validPriorities.includes(this.priority)) {
      throw new Error(`Invalid priority level: ${this.priority}`);
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Notification title is required');
    }

    if (!this.message || this.message.trim().length === 0) {
      throw new Error('Notification message is required');
    }
  }

  /**
   * Marks notification as read
   */
  markAsRead() {
    this.isRead = true;
    this.updatedAt = new Date();
  }

  /**
   * Marks notification as unread
   */
  markAsUnread() {
    this.isRead = false;
    this.updatedAt = new Date();
  }

  /**
   * Sets priority level
   * @param {string} priority - Priority level
   */
  setPriority(priority) {
    const validPriorities = Object.values(PriorityLevel);
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority level: ${priority}`);
    }
    this.priority = priority;
    this.updatedAt = new Date();
  }

  /**
   * Sets expiration date
   * @param {Date} expiresAt - Expiration date
   */
  setExpiresAt(expiresAt) {
    this.expiresAt = expiresAt;
    this.updatedAt = new Date();
  }

  /**
   * Checks if notification is read
   * @returns {boolean} True if notification is read
   */
  isNotificationRead() {
    return this.isRead === true;
  }

  /**
   * Checks if notification should be sent
   * @returns {boolean} True if notification is unread
   */
  shouldNotify() {
    return !this.isRead;
  }

  /**
   * Checks if notification is expired
   * @returns {boolean} True if notification is expired
   */
  isExpired() {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }

  /**
   * Checks if notification is high priority
   * @returns {boolean} True if priority is high or urgent
   */
  isHighPriority() {
    return (
      this.priority === PriorityLevel.HIGH ||
      this.priority === PriorityLevel.URGENT
    );
  }

  /**
   * Checks if notification is urgent
   * @returns {boolean} True if priority is urgent
   */
  isUrgent() {
    return this.priority === PriorityLevel.URGENT;
  }

  /**
   * Gets notification age in hours
   * @returns {number} Hours since notification was created
   */
  getAgeInHours() {
    if (!this.createdAt) return 0;
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffMs = now - created;
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  /**
   * Checks if notification is recent (< 24 hours)
   * @returns {boolean} True if notification is less than 24 hours old
   */
  isRecent() {
    return this.getAgeInHours() < 24;
  }
}

module.exports = Notification;
