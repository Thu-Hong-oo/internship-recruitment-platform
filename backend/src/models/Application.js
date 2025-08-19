const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    jobId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true 
    },
    jobseekerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    employerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    coverLetter: String,
    resume: String, // URL to uploaded resume
    portfolio: String, // URL to portfolio
    expectedSalary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'VND' }
    },
    availability: {
      startDate: Date,
      duration: Number, // in months
      fullTime: { type: Boolean, default: false }
    },
    // AI matching score
    aiScore: {
      overall: { type: Number, min: 0, max: 100 },
      skills: { type: Number, min: 0, max: 100 },
      experience: { type: Number, min: 0, max: 100 },
      education: { type: Number, min: 0, max: 100 }
    },
    // Communication history
    messages: [{
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      timestamp: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false }
    }],
    // Interview scheduling
    interview: {
      scheduled: { type: Boolean, default: false },
      date: Date,
      location: String,
      type: { type: String, enum: ['online', 'onsite', 'phone'] },
      notes: String
    },
    // Notes from employer
    employerNotes: String,
    // Application tracking
    appliedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    isWithdrawn: { type: Boolean, default: false },
    withdrawnAt: Date
  },
  { timestamps: true }
);

// Indexes
ApplicationSchema.index({ jobId: 1, jobseekerId: 1 }, { unique: true });
ApplicationSchema.index({ jobseekerId: 1, status: 1 });
ApplicationSchema.index({ employerId: 1, status: 1 });
ApplicationSchema.index({ companyId: 1, status: 1 });
ApplicationSchema.index({ status: 1, appliedAt: -1 });
ApplicationSchema.index({ 'aiScore.overall': -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
