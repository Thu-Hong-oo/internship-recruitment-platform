const { getIO } = require('../config/socket');
const Notification = require('../models/Notification');

const notificationService = {
  async createAndSend(notificationData) {
    try {
      // Tạo notification trong database
      const notification = await Notification.create(notificationData);

      // Gửi realtime notification qua socket
      const io = getIO();
      if (io) {
        io.to(notificationData.userId).emit('notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating and sending notification:', error);
      throw error;
    }
  },

  async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  },

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false,
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },
};

module.exports = notificationService;
