const mongoose = require('mongoose');

const EmployerProfileSchema = new mongoose.Schema(
  {
    // User owner của profile này
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Reference đến Company (nhiều profiles → 1 company)
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    // Vai trò của user này trong công ty
    position: {
      title: { type: String, required: true },
      level: {
        type: String,
        enum: ['junior', 'mid', 'senior', 'lead', 'executive'],
      },
      department: { type: String },
    },

    // Role trong hệ thống
    role: {
      type: String,
      enum: ['owner', 'admin', 'recruiter', 'interviewer', 'viewer'],
      default: 'recruiter',
      required: true,
    },

    // Permissions chi tiết
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

    // Contact info cá nhân
    contact: {
      phone: { type: String },
      email: { type: String },
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'active',
    },

    // Invitation info (nếu được mời)
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedAt: { type: Date },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
