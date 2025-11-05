/**
 * NotificationService
 * Domain: Notification
 * Domain service for managing notification operations
 */
class NotificationService {
  constructor(props) {
    this._notificationRepository = props.notificationRepository;
    this._notificationTemplateRepository = props.notificationTemplateRepository;
    this._eventPublisher = props.eventPublisher; // For publishing notification events
  }

  /**
   * Send notification to a user
   * @param {string} userId - Target user ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {string} priority - Priority level
   * @param {string[]} deliveryMethods - Delivery methods
   * @returns {Promise<Notification>}
   */
  async sendNotification(
    userId,
    type,
    data,
    priority = 'normal',
    deliveryMethods = ['in-app']
  ) {
    const notification = new Notification({
      notificationId: this._generateId(),
      userId,
      type,
      title: data.title,
      message: data.message,
      data,
      priority,
      deliveryMethods,
      status: 'pending',
      createdAt: new Date(),
    });

    await this._notificationRepository.save(notification);

    // Publish notification sent event
    if (this._eventPublisher) {
      await this._eventPublisher.publish('notification.sent', {
        notificationId: notification.notificationId,
        userId,
        type,
        priority,
      });
    }

    return notification;
  }

  /**
   * Send notification using template
   * @param {string} userId - Target user ID
   * @param {string} templateId - Template ID
   * @param {Object} templateData - Data to fill template
   * @param {string} priority - Priority level
   * @param {string[]} deliveryMethods - Delivery methods
   * @returns {Promise<Notification>}
   */
  async sendNotificationFromTemplate(
    userId,
    templateId,
    templateData,
    priority = 'normal',
    deliveryMethods = ['in-app']
  ) {
    const template = await this._notificationTemplateRepository.findById(
      templateId
    );
    if (!template) {
      throw new Error(`Notification template ${templateId} not found`);
    }

    const filledTemplate = template.fillTemplate(templateData);

    return await this.sendNotification(
      userId,
      template.type,
      {
        title: filledTemplate.title,
        message: filledTemplate.message,
        ...templateData,
      },
      priority,
      deliveryMethods
    );
  }

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId, userId) {
    const notification = await this._notificationRepository.findById(
      notificationId
    );
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to mark notification as read');
    }

    notification.markAsRead();
    await this._notificationRepository.save(notification);

    // Publish notification read event
    if (this._eventPublisher) {
      await this._eventPublisher.publish('notification.read', {
        notificationId,
        userId,
      });
    }
  }

  /**
   * Mark notification as delivered
   * @param {string} notificationId
   * @param {string} deliveryMethod
   * @returns {Promise<void>}
   */
  async markAsDelivered(notificationId, deliveryMethod) {
    const notification = await this._notificationRepository.findById(
      notificationId
    );
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    notification.markAsDelivered(deliveryMethod);
    await this._notificationRepository.save(notification);

    // Publish notification delivered event
    if (this._eventPublisher) {
      await this._eventPublisher.publish('notification.delivered', {
        notificationId,
        deliveryMethod,
      });
    }
  }

  /**
   * Get user notifications
   * @param {string} userId
   * @param {Object} filters - Filter options
   * @returns {Promise<Notification[]>}
   */
  async getUserNotifications(userId, filters = {}) {
    return await this._notificationRepository.findByUserId(userId, filters);
  }

  /**
   * Get unread notification count for user
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    return await this._notificationRepository.countUnreadByUserId(userId);
  }

  /**
   * Bulk send notifications
   * @param {string[]} userIds - Target user IDs
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {string} priority - Priority level
   * @param {string[]} deliveryMethods - Delivery methods
   * @returns {Promise<Notification[]>}
   */
  async bulkSendNotification(
    userIds,
    type,
    data,
    priority = 'normal',
    deliveryMethods = ['in-app']
  ) {
    const notifications = [];

    for (const userId of userIds) {
      const notification = await this.sendNotification(
        userId,
        type,
        data,
        priority,
        deliveryMethods
      );
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Create notification template
   * @param {Object} templateData
   * @returns {Promise<NotificationTemplate>}
   */
  async createTemplate(templateData) {
    const template = new NotificationTemplate({
      templateId: this._generateId(),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this._notificationTemplateRepository.save(template);
    return template;
  }

  /**
   * Get notification template by ID
   * @param {string} templateId
   * @returns {Promise<NotificationTemplate|null>}
   */
  async getTemplateById(templateId) {
    return await this._notificationTemplateRepository.findById(templateId);
  }

  /**
   * Get all notification templates
   * @param {Object} filters
   * @returns {Promise<NotificationTemplate[]>}
   */
  async getAllTemplates(filters = {}) {
    return await this._notificationTemplateRepository.findAll(filters);
  }

  /**
   * Update notification template
   * @param {string} templateId
   * @param {Object} updates
   * @returns {Promise<NotificationTemplate>}
   */
  async updateTemplate(templateId, updates) {
    const template = await this._notificationTemplateRepository.findById(
      templateId
    );
    if (!template) {
      throw new Error(`Notification template ${templateId} not found`);
    }

    template.update(updates);
    await this._notificationTemplateRepository.save(template);
    return template;
  }

  /**
   * Delete notification template
   * @param {string} templateId
   * @returns {Promise<void>}
   */
  async deleteTemplate(templateId) {
    const template = await this._notificationTemplateRepository.findById(
      templateId
    );
    if (!template) {
      throw new Error(`Notification template ${templateId} not found`);
    }

    await this._notificationTemplateRepository.delete(templateId);
  }

  /**
   * Send job application notification
   * @param {string} candidateId
   * @param {string} jobId
   * @param {string} employerId
   * @returns {Promise<Notification>}
   */
  async sendJobApplicationNotification(candidateId, jobId, employerId) {
    return await this.sendNotificationFromTemplate(
      employerId,
      'job-application-received',
      {
        candidateId,
        jobId,
        appliedAt: new Date(),
      },
      'normal',
      ['in-app', 'email']
    );
  }

  /**
   * Send application status update notification
   * @param {string} candidateId
   * @param {string} jobId
   * @param {string} status
   * @returns {Promise<Notification>}
   */
  async sendApplicationStatusNotification(candidateId, jobId, status) {
    return await this.sendNotificationFromTemplate(
      candidateId,
      'application-status-update',
      {
        jobId,
        status,
        updatedAt: new Date(),
      },
      'high',
      ['in-app', 'email']
    );
  }

  /**
   * Send job match notification
   * @param {string} candidateId
   * @param {string} jobId
   * @param {number} matchScore
   * @returns {Promise<Notification>}
   */
  async sendJobMatchNotification(candidateId, jobId, matchScore) {
    return await this.sendNotificationFromTemplate(
      candidateId,
      'job-match-found',
      {
        jobId,
        matchScore,
        foundAt: new Date(),
      },
      'normal',
      ['in-app']
    );
  }

  /**
   * Generate unique ID for notifications
   * @returns {string}
   */
  _generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = NotificationService;
