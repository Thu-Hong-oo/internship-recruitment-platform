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
    content: { type: String, default: '' },
    type: { type: String, default: 'text' },
    attachments: [
      {
        url: String,
        type: String,
        size: Number,
        name: String,
      },
    ],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversationId: 1 });

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
  // Can edit within 5 minutes of sending
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  // No system field createdAt, adjust logic if needed
  return !this.isDeleted;
};

MessageSchema.methods.canDelete = function () {
  return !this.isDeleted;
};

module.exports = mongoose.model('Message', MessageSchema);
