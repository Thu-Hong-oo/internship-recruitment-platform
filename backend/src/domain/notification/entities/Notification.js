/**
 * Notification Entity
 * Domain: Notification
 * Represents a notification sent to a user
 */
class Notification {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.notificationType = props.notificationType;
    this.title = props.title;
    this.message = props.message;
    this.deliveryMethod = props.deliveryMethod;
    this.notificationStatus = props.notificationStatus;
    this.priority = props.priority || 'NORMAL';
    this.metadata = props.metadata || {};
    this.sentAt = props.sentAt;
    this.deliveredAt = props.deliveredAt;
    this.readAt = props.readAt;
    this.expiresAt = props.expiresAt;
    this.referenceId = props.referenceId; // ID of related entity (job, application, etc.)

    this.validate();
  }

  validate() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    if (!this.notificationType) {
      throw new Error('Notification type is required');
    }
    if (!this.title) {
      throw new Error('Notification title is required');
    }
    if (!this.message) {
      throw new Error('Notification message is required');
    }
    if (!this.deliveryMethod) {
      throw new Error('Delivery method is required');
    }
    if (!this.notificationStatus) {
      throw new Error('Notification status is required');
    }
  }

  isSent() {
    return this.notificationStatus === 'SENT' ||
           this.notificationStatus === 'DELIVERED' ||
           this.notificationStatus === 'READ';
  }

  isDelivered() {
    return this.notificationStatus === 'DELIVERED' ||
           this.notificationStatus === 'READ';
  }

  isRead() {
    return this.notificationStatus === 'READ';
  }

  isExpired() {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  markSent() {
    this.notificationStatus = 'SENT';
    this.sentAt = new Date();
  }

  markDelivered() {
    this.notificationStatus = 'DELIVERED';
    this.deliveredAt = new Date();
  }

  markRead() {
    this.notificationStatus = 'READ';
    this.readAt = new Date();
  }

  markFailed() {
    this.notificationStatus = 'FAILED';
  }

  cancel() {
    this.notificationStatus = 'CANCELLED';
  }

  addMetadata(key, value) {
    this.metadata[key] = value;
  }

  getMetadata(key) {
    return this.metadata[key];
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      notificationType: this.notificationType,
      title: this.title,
      message: this.message,
      deliveryMethod: this.deliveryMethod,
      notificationStatus: this.notificationStatus,
      priority: this.priority,
      metadata: this.metadata,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      readAt: this.readAt,
      expiresAt: this.expiresAt,
      referenceId: this.referenceId,
      isRead: this.isRead(),
      isExpired: this.isExpired()
    };
  }
}

module.exports = Notification;