const NotificationModel = require('../models/Notification');
const INotificationRepository = require('../../domain/notification/repositories/INotificationRepository');
const NotificationMapper = require('../mappers/NotificationMapper');

/**
 * NotificationRepository
 * Infrastructure layer implementation of INotificationRepository
 * Uses NotificationMapper to convert between domain entities and Mongoose documents
 */
class NotificationRepository extends INotificationRepository {
  async findById(id) {
    const notificationDoc = await NotificationModel.findById(id);
    return notificationDoc
      ? NotificationMapper.toDomain(notificationDoc)
      : null;
  }

  async findByUser(userId) {
    const notificationDocs = await NotificationModel.find({ userId }).sort({
      createdAt: -1,
    });
    return NotificationMapper.toDomainArray(notificationDocs);
  }

  async findUnreadByUser(userId) {
    const notificationDocs = await NotificationModel.find({
      userId,
      isRead: false,
    }).sort({ createdAt: -1 });
    return NotificationMapper.toDomainArray(notificationDocs);
  }

  async findAll() {
    const notificationDocs = await NotificationModel.find().populate('userId');
    return NotificationMapper.toDomainArray(notificationDocs);
  }

  async create(notificationEntity) {
    const notificationData = NotificationMapper.toMongoose(notificationEntity);
    const notification = new NotificationModel(notificationData);
    const savedDoc = await notification.save();
    return NotificationMapper.toDomain(savedDoc);
  }

  async update(id, notificationEntity) {
    const notificationData = NotificationMapper.toMongoose(notificationEntity);
    const updatedDoc = await NotificationModel.findByIdAndUpdate(
      id,
      notificationData,
      {
        new: true,
      }
    );
    return updatedDoc ? NotificationMapper.toDomain(updatedDoc) : null;
  }

  async delete(id) {
    const deletedDoc = await NotificationModel.findByIdAndDelete(id);
    return deletedDoc ? NotificationMapper.toDomain(deletedDoc) : null;
  }

  async markAsRead(id) {
    const updatedDoc = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    return updatedDoc ? NotificationMapper.toDomain(updatedDoc) : null;
  }

  async markAllAsRead(userId) {
    await NotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return true;
  }

  async countUnreadByUser(userId) {
    return await NotificationModel.countDocuments({ userId, isRead: false });
  }

  async findByType(type) {
    const notificationDocs = await NotificationModel.find({ type });
    return NotificationMapper.toDomainArray(notificationDocs);
  }

  async findByPriority(priority) {
    const notificationDocs = await NotificationModel.find({ priority }).sort({
      createdAt: -1,
    });
    return NotificationMapper.toDomainArray(notificationDocs);
  }

  async deleteOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await NotificationModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    return result.deletedCount;
  }

  async deleteExpired() {
    const now = new Date();
    const result = await NotificationModel.deleteMany({
      expiresAt: { $ne: null, $lt: now },
    });
    return result.deletedCount;
  }
}

module.exports = NotificationRepository;
