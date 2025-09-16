const mongoose = require('mongoose');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_CHANNELS,
} = require('../constants/common.constants');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
      applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
      interviewTime: Date,
      chatRoomId: String,
      url: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITY),
      default: NOTIFICATION_PRIORITY.LOW,
    },
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: NOTIFICATION_CHANNELS.IN_APP,
    },
    // delivery and lifecycle fields
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    archivedAt: Date,
    actionRequired: { type: Boolean, default: false },
    dedupeKey: { type: String, index: true },
    templateKey: String,
    locale: { type: String, default: 'vi' },
    error: {
      code: String,
      message: String,
      retries: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Thêm index cho queries phổ biến
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ dedupeKey: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
