const mongoose = require('mongoose');
const NotificationType = require('../../domain/notification/enums/NotificationType');
const PriorityLevel = require('../../domain/notification/enums/PriorityLevel');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: { type: String, enum: Object.values(NotificationType) },
    title: String,
    message: String,
    actionUrl: String,
    relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost' },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    isRead: Boolean,
    priority: {
      type: String,
      enum: Object.values(PriorityLevel),
      default: PriorityLevel.LOW,
    },
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt tự động
  }
);

NotificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  await this.save();
  return this;
};

NotificationSchema.methods.shouldNotify = function () {
  return !this.isRead;
};

module.exports = mongoose.model('Notification', NotificationSchema);
