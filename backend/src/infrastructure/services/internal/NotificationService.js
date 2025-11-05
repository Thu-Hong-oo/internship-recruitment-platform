/**
 * NotificationService - Handles notification operations
 * Dependencies injected via constructor for proper DI
 */
class NotificationService {
  constructor(
    notificationRepository,
    userRepository,
    validationService,
    socketService,
    emailService
  ) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.validationService = validationService;
    this.socketService = socketService;
    this.emailService = emailService;
  }

  async getUserNotifications(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, type, isRead } = filters;
      const skip = (page - 1) * limit;

      const query = { userId };
      if (type) query.type = type;
      if (isRead !== undefined) query.isRead = isRead === 'true';

      const notifications = await this.notificationRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
      });

      const total = await this.notificationRepository.count(query);

      return {
        success: true,
        notifications: notifications.map(notif => ({
          id: notif._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: notif.data,
          isRead: notif.isRead,
          priority: notif.priority,
          createdAt: notif.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get user notifications failed: ${error.message}`);
    }
  }

  async getNotificationById(notificationId, userId) {
    try {
      const notification = await this.notificationRepository.findById(
        notificationId
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if user owns the notification
      if (notification.userId.toString() !== userId) {
        throw new Error('Access denied');
      }

      return {
        success: true,
        notification: {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          priority: notification.priority,
          createdAt: notification.createdAt,
        },
      };
    } catch (error) {
      throw new Error(`Get notification by ID failed: ${error.message}`);
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await this.notificationRepository.findById(
        notificationId
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if user owns the notification
      if (notification.userId.toString() !== userId) {
        throw new Error('Access denied');
      }

      // Mark as read
      const updatedNotification = await this.notificationRepository.update(
        notificationId,
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      return {
        success: true,
        notification: {
          id: updatedNotification._id,
          isRead: updatedNotification.isRead,
          readAt: updatedNotification.readAt,
        },
        message: 'Notification marked as read',
      };
    } catch (error) {
      throw new Error(`Mark notification as read failed: ${error.message}`);
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      await this.notificationRepository.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      throw new Error(
        `Mark all notifications as read failed: ${error.message}`
      );
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const notification = await this.notificationRepository.findById(
        notificationId
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if user owns the notification
      if (notification.userId.toString() !== userId) {
        throw new Error('Access denied');
      }

      // Delete notification
      await this.notificationRepository.delete(notificationId);

      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete notification failed: ${error.message}`);
    }
  }

  async getUnreadNotificationCount(userId) {
    try {
      const unreadCount = await this.notificationRepository.count({
        userId,
        isRead: false,
      });

      return {
        success: true,
        unreadCount,
      };
    } catch (error) {
      throw new Error(`Get unread notification count failed: ${error.message}`);
    }
  }

  async createNotification(notificationData) {
    try {
      const {
        userId,
        type,
        title,
        message,
        data,
        priority = 'medium',
      } = notificationData;

      // Create notification
      const notification = await this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        data,
        priority,
        isRead: false,
      });

      // Send real-time notification
      SocketService.sendToUser(userId, 'new-notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        createdAt: notification.createdAt,
      });

      return {
        success: true,
        notification: {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
        },
        message: 'Notification created successfully',
      };
    } catch (error) {
      throw new Error(`Create notification failed: ${error.message}`);
    }
  }

  async getNotificationSettings(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's notification preferences
      const settings = user.notificationSettings || {
        email: {
          applicationUpdates: true,
          jobMatches: true,
          systemAlerts: true,
          marketing: false,
        },
        push: {
          applicationUpdates: true,
          jobMatches: true,
          systemAlerts: true,
          marketing: false,
        },
        sms: {
          applicationUpdates: false,
          jobMatches: false,
          systemAlerts: true,
          marketing: false,
        },
      };

      return {
        success: true,
        settings,
      };
    } catch (error) {
      throw new Error(`Get notification settings failed: ${error.message}`);
    }
  }

  async updateNotificationSettings(userId, settings) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update notification settings
      const updatedUser = await this.userRepository.update(userId, {
        notificationSettings: settings,
      });

      return {
        success: true,
        settings: updatedUser.notificationSettings,
        message: 'Notification settings updated successfully',
      };
    } catch (error) {
      throw new Error(`Update notification settings failed: ${error.message}`);
    }
  }

  async getNotificationStats(userId) {
    try {
      const totalNotifications = await this.notificationRepository.count({
        userId,
      });
      const unreadNotifications = await this.notificationRepository.count({
        userId,
        isRead: false,
      });
      const readNotifications = totalNotifications - unreadNotifications;

      const notificationsByType = await this.notificationRepository.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);

      const recentNotifications = await this.notificationRepository.find(
        { userId },
        { limit: 5, sort: { createdAt: -1 } }
      );

      return {
        success: true,
        stats: {
          totalNotifications,
          unreadNotifications,
          readNotifications,
          notificationsByType,
          recentNotifications: recentNotifications.map(notif => ({
            id: notif._id,
            type: notif.type,
            title: notif.title,
            isRead: notif.isRead,
            createdAt: notif.createdAt,
          })),
        },
      };
    } catch (error) {
      throw new Error(`Get notification stats failed: ${error.message}`);
    }
  }

  // Helper method to send notification to multiple users
  async sendBulkNotification(userIds, notificationData) {
    try {
      const notifications = [];
      for (const userId of userIds) {
        const notification = await this.createNotification({
          ...notificationData,
          userId,
        });
        notifications.push(notification.notification);
      }

      return {
        success: true,
        notifications,
        message: `Notifications sent to ${userIds.length} users`,
      };
    } catch (error) {
      throw new Error(`Send bulk notification failed: ${error.message}`);
    }
  }

  // Helper method to send system-wide notification
  async sendSystemNotification(notificationData) {
    try {
      // Get all active users
      const users = await this.userRepository.find({ status: 'active' });
      const userIds = users.map(user => user._id);

      return await this.sendBulkNotification(userIds, notificationData);
    } catch (error) {
      throw new Error(`Send system notification failed: ${error.message}`);
    }
  }
}

module.exports = NotificationService;
