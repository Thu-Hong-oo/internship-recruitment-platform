const mongoose = require('mongoose');

const CompanyInvitationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['admin', 'recruiter', 'interviewer', 'viewer'],
      default: 'recruiter',
      required: true,
    },
    permissions: {
      canPostJobs: { type: Boolean, default: false },
      canEditJobs: { type: Boolean, default: false },
      canDeleteJobs: { type: Boolean, default: false },
      canViewApplications: { type: Boolean, default: true },
      canReviewApplications: { type: Boolean, default: false },
      canScheduleInterviews: { type: Boolean, default: false },
      canManageMembers: { type: Boolean, default: false },
      canEditCompanyInfo: { type: Boolean, default: false },
    },
    position: {
      title: { type: String },
      department: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    acceptedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Index for email + company (prevent duplicate invitations)
CompanyInvitationSchema.index({ company: 1, email: 1, status: 1 });

// Check if invitation is expired
CompanyInvitationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date() || this.status === 'expired';
};

module.exports = mongoose.model('CompanyInvitation', CompanyInvitationSchema);
