const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'AUDIO', 'VIDEO', 'LOCATION'],
      default: 'TEXT',
      index: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String },
        size: { type: Number },
        name: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// FIXED: Remove duplicate index (conversationId already has index: true above)
// Compound indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, isDeleted: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

// Legacy methods for backward compatibility (moved to domain entity)
MessageSchema.methods.markAsRead = async function (userId) {
  if (!this.readBy.some(id => String(id) === String(userId))) {
    this.readBy.push(userId);
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

MessageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some(id => String(id) === String(userId));
};

MessageSchema.methods.canEdit = function () {
  if (this.isDeleted) return false;
  if (this.type !== 'TEXT') return false;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.createdAt > fiveMinutesAgo;
};

MessageSchema.methods.canDelete = function () {
  return !this.isDeleted;
};

module.exports = mongoose.model('Message', MessageSchema);
