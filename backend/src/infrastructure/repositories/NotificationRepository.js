const Notification = require('../models/Notification');
const INotificationRepository = require('../../domain/notification/repositories/INotificationRepository');

/**
 * NotificationRepository
 * Infrastructure layer implementation of INotificationRepository
 */
class NotificationRepository extends INotificationRepository {
  async findById(id) {
    return await Notification.findById(id);
  }

  async findByUser(userId) {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  }

  async findUnreadByUser(userId) {
    return await Notification.find({ userId, isRead: false });
  }

  async findAll() {
    return await Notification.find().populate('userId');
  }

  async create(notificationData) {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  async update(id, notificationData) {
    return await Notification.findByIdAndUpdate(id, notificationData, {
      new: true,
    });
  }

  async delete(id) {
    return await Notification.findByIdAndDelete(id);
  }

  async markAsRead(id) {
    return await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async countUnreadByUser(userId) {
    return await Notification.countDocuments({ userId, isRead: false });
  }

  async findByType(type) {
    return await Notification.find({ type });
  }

  async deleteOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return await Notification.deleteMany({ createdAt: { $lt: cutoffDate } });
  }
}

module.exports = NotificationRepository;
