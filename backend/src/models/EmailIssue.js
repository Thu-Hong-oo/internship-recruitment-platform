const mongoose = require('mongoose');

const emailIssueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for cases where user doesn't exist yet
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  issueType: {
    type: String,
    enum: ['INVALID_EMAIL_ADDRESS', 'EMAIL_SEND_FAILED', 'BOUNCE_BACK'],
    required: true,
  },
  errorMessage: {
    type: String,
    required: true,
  },
  errorCode: {
    type: String,
  },
  responseCode: {
    type: String,
  },
  operation: {
    type: String,
    enum: ['REGISTER', 'RESEND_VERIFICATION', 'PASSWORD_RESET'],
    required: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
emailIssueSchema.index({ email: 1, createdAt: -1 });
emailIssueSchema.index({ userId: 1, createdAt: -1 });
emailIssueSchema.index({ issueType: 1, resolved: 1 });
emailIssueSchema.index({ operation: 1, createdAt: -1 });

// Virtual for issue age
emailIssueSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Static method to create email issue
emailIssueSchema.statics.createIssue = async function(data) {
  const issue = new this({
    userId: data.userId,
    email: data.email,
    issueType: data.issueType,
    errorMessage: data.errorMessage,
    errorCode: data.errorCode,
    responseCode: data.responseCode,
    operation: data.operation,
  });
  
  return await issue.save();
};

// Static method to get unresolved issues
emailIssueSchema.statics.getUnresolvedIssues = async function(limit = 50) {
  return await this.find({ resolved: false })
    .populate('userId', 'email firstName lastName role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get issues by email
emailIssueSchema.statics.getIssuesByEmail = async function(email) {
  return await this.find({ email: email.toLowerCase() })
    .populate('userId', 'email firstName lastName role')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('EmailIssue', emailIssueSchema);
