const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['DIRECT', 'GROUP', 'JOB_APPLICATION', 'SUPPORT'],
      default: 'DIRECT',
      index: true,
    },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length >= 2;
        },
        message: 'Conversation must have at least 2 participants',
      },
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      index: true,
      sparse: true, // Only index non-null values
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
      sparse: true,
    },
    lastMessage: {
      messageId: { type: mongoose.Schema.Types.ObjectId },
      text: { type: String },
      content: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId },
      timestamp: { type: Date },
      sentAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
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

// Compound indexes for efficient queries
ConversationSchema.index({ participants: 1, type: 1 });
ConversationSchema.index({ participants: 1, status: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Legacy methods for backward compatibility (moved to domain entity)
ConversationSchema.methods.getUnreadCount = function (userId) {
  // This logic moved to MessageRepository.countUnreadByConversation
  return 0;
};

ConversationSchema.methods.addParticipant = async function (userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    await this.save();
  }
};

module.exports = mongoose.model('Conversation', ConversationSchema);
