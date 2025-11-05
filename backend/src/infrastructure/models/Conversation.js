const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    type: String,
    participants: [mongoose.Schema.Types.ObjectId],
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost' },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    lastMessage: Object,
    status: String,
  },
  {
    timestamps: true,
  }
);

ConversationSchema.methods.getUnreadCount = function (userId) {
  // Implement logic to count unread messages for userId
  return 0;
};

ConversationSchema.methods.addParticipant = async function (userId, role) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    await this.save();
  }
};

module.exports = mongoose.model('Conversation', ConversationSchema);
