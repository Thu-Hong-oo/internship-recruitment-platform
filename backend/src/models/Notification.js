const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    type: { 
      type: String, 
      enum: [
        'job_application', 
        'application_status', 
        'new_message', 
        'interview_scheduled',
        'job_recommendation',
        'system_alert',
        'company_update'
      ],
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
      url: String,
      metadata: mongoose.Schema.Types.Mixed
    },
    isRead: { type: Boolean, default: false },
    isEmailSent: { type: Boolean, default: false },
    isPushSent: { type: Boolean, default: false },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    },
    expiresAt: Date
  },
  { timestamps: true }
);

// Indexes
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', NotificationSchema);
