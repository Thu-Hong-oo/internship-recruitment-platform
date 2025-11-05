/**
 * Create Notification Use Case
 * Creates a new notification for users
 */

class CreateNotificationUseCase {
  constructor(notificationRepository, userRepository) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
  }

  async execute(notificationData) {
    try {
      // Validate notification data
      const validation = this._validateNotificationData(notificationData);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Validate recipient(s)
      const recipients = await this._validateRecipients(
        notificationData.recipients
      );
      if (recipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      // Create notifications for each recipient
      const createdNotifications = [];

      for (const recipientId of recipients) {
        const notification = {
          recipientId,
          senderId: notificationData.senderId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          priority: notificationData.priority || 'normal',
          category: notificationData.category || 'general',
          actionUrl: notificationData.actionUrl,
          actionText: notificationData.actionText,
          expiresAt: notificationData.expiresAt,
          scheduledFor: notificationData.scheduledFor || new Date(),
          deliveryMethods: notificationData.deliveryMethods || ['in_app'],
          status:
            notificationData.scheduledFor &&
            notificationData.scheduledFor > new Date()
              ? 'scheduled'
              : 'pending',
          readAt: null,
          deliveredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const createdNotification = await this.notificationRepository.create(
          notification
        );
        createdNotifications.push(createdNotification);

        // Send immediately if not scheduled
        if (notification.status === 'pending') {
          await this._sendNotification(createdNotification);
        }
      }

      return {
        success: true,
        data: {
          notifications: createdNotifications,
          count: createdNotifications.length,
        },
        message: `Successfully created ${createdNotifications.length} notification(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _validateNotificationData(data) {
    if (!data.title || data.title.trim().length === 0) {
      return { isValid: false, message: 'Notification title is required' };
    }

    if (!data.message || data.message.trim().length === 0) {
      return { isValid: false, message: 'Notification message is required' };
    }

    if (
      !data.recipients ||
      !Array.isArray(data.recipients) ||
      data.recipients.length === 0
    ) {
      return { isValid: false, message: 'At least one recipient is required' };
    }

    if (!data.type) {
      return { isValid: false, message: 'Notification type is required' };
    }

    const validTypes = [
      'application_received',
      'application_status_update',
      'job_match',
      'new_message',
      'interview_scheduled',
      'profile_incomplete',
      'skill_recommendation',
      'roadmap_progress',
      'system_announcement',
      'welcome',
      'verification_required',
      'account_update',
    ];

    if (!validTypes.includes(data.type)) {
      return { isValid: false, message: 'Invalid notification type' };
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      return { isValid: false, message: 'Invalid notification priority' };
    }

    const validDeliveryMethods = ['in_app', 'email', 'sms', 'push'];
    if (data.deliveryMethods) {
      const invalidMethods = data.deliveryMethods.filter(
        method => !validDeliveryMethods.includes(method)
      );
      if (invalidMethods.length > 0) {
        return {
          isValid: false,
          message: `Invalid delivery methods: ${invalidMethods.join(', ')}`,
        };
      }
    }

    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
      return {
        isValid: false,
        message: 'Expiration date must be in the future',
      };
    }

    return { isValid: true };
  }

  async _validateRecipients(recipientIds) {
    try {
      const validRecipients = [];

      for (const recipientId of recipientIds) {
        const user = await this.userRepository.findById(recipientId);
        if (user && user.status === 'active') {
          validRecipients.push(recipientId);
        }
      }

      return validRecipients;
    } catch (error) {
      console.error('Error validating recipients:', error);
      return [];
    }
  }

  async _sendNotification(notification) {
    try {
      // Update status to delivered
      await this.notificationRepository.update(notification.id, {
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date(),
      });

      // Here you would integrate with actual delivery services:
      // - In-app: Update real-time via WebSocket
      // - Email: Send via email service
      // - SMS: Send via SMS service
      // - Push: Send via push notification service

      // For now, just mark as delivered
      console.log(
        `Notification delivered to user ${notification.recipientId}: ${notification.title}`
      );
    } catch (error) {
      console.error('Error sending notification:', error);

      // Update status to failed
      await this.notificationRepository.update(notification.id, {
        status: 'failed',
        failureReason: error.message,
        updatedAt: new Date(),
      });
    }
  }
}

module.exports = CreateNotificationUseCase;
