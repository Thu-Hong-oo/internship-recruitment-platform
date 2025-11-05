/**
 * NotificationResponseDTO
 * Transforms infrastructure Notification model into API-friendly format
 */
class NotificationResponseDTO {
  constructor(notificationModel) {
    this.id = notificationModel._id;
    this.userId = notificationModel.userId;
    this.type = notificationModel.type;
    this.title = notificationModel.title;
    this.message = notificationModel.message;
    this.actionUrl = notificationModel.actionUrl;
    this.relatedJob = notificationModel.relatedJob;
    this.relatedApplication = notificationModel.relatedApplication;
    this.isRead = notificationModel.isRead;
    this.priority = notificationModel.priority;
    this.createdAt = notificationModel.createdAt;
    this.updatedAt = notificationModel.updatedAt;

    // Computed fields
    this.shouldNotify = notificationModel.shouldNotify();
  }

  /**
   * Factory method to create DTO from Notification model
   */
  static fromNotification(notificationModel) {
    return new NotificationResponseDTO(notificationModel);
  }

  /**
   * Factory method to create DTOs from array of Notification models
   */
  static fromNotifications(notificationModels) {
    return notificationModels.map(model => new NotificationResponseDTO(model));
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      actionUrl: this.actionUrl,
      relatedJob: this.relatedJob,
      relatedApplication: this.relatedApplication,
      isRead: this.isRead,
      priority: this.priority,
      shouldNotify: this.shouldNotify,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = NotificationResponseDTO;
