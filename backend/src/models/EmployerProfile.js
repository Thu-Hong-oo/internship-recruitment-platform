const mongoose = require('mongoose');
const {
  USER_ROLES,
  EMPLOYER_PROFILE_STATUS,
} = require('../constants/common.constants');

// Giữ nguyên sub-schemas nhưng tối ưu
const CompanyInfoSchema = require('./schemas/CompanyInfoSchema');
const BusinessInfoSchema = require('./schemas/BusinessInfoSchema');
const VerificationSchema = require('./schemas/VerificationSchema');

const EmployerProfileSchema = new mongoose.Schema(
  {
    // Chủ tài khoản
    owner: {
      // Đổi từ mainUserId cho rõ ràng
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Thông tin công ty
    company: CompanyInfoSchema,

    // Thông tin pháp lý (CẦN THIẾT tại VN)
    businessInfo: BusinessInfoSchema,

    // Người đại diện pháp luật (BẮT BUỘC theo luật)
    legalRepresentative: {
      fullName: { type: String, required: true },
      position: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      identification: {
        type: {
          type: String,
          enum: ['CMND', 'CCCD', 'Passport'],
          required: false, // không Bắt buộc
        },
        number: { type: String, required: false }, // không Bắt buộc
        issueDate: { type: Date, required: false }, // không Bắt buộc
        issuePlace: { type: String, required: false },
      },
    },

    // Liên hệ chính
    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
    },

    // Team members (CẦN THIẾT cho company)
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: ['admin', 'hr', 'recruiter', 'manager'],
          default: 'recruiter',
        },
        permissions: {
          canPostJobs: { type: Boolean, default: true },
          canViewApplications: { type: Boolean, default: true },
          canEditProfile: { type: Boolean, default: false },
          canManageTeam: { type: Boolean, default: false },
        },
        status: {
          type: String,
          enum: ['active', 'inactive', 'pending'],
          default: 'pending',
        },
        invitedAt: { type: Date, default: Date.now },
        joinedAt: Date,
      },
    ],

    // Verification process (CẦN THIẾT)
    verification: VerificationSchema,

    // Status
    status: {
      type: String,
      enum: Object.values(EMPLOYER_PROFILE_STATUS),
      default: EMPLOYER_PROFILE_STATUS.DRAFT,
    },

    // Stats
    stats: {
      totalJobs: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      successfulHires: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Tối ưu indexes
EmployerProfileSchema.index({ owner: 1 }, { unique: true });
EmployerProfileSchema.index({ 'company.name': 'text' });
EmployerProfileSchema.index({ 'company.industry': 1 });
EmployerProfileSchema.index({ 'businessInfo.taxId': 1 }, { unique: true });
EmployerProfileSchema.index({ status: 1, 'verification.isVerified': 1 });

// Virtuals hữu ích
EmployerProfileSchema.virtual('isVerified').get(function () {
  return (
    this.verification.isVerified &&
    this.status === EMPLOYER_PROFILE_STATUS.VERIFIED
  );
});

EmployerProfileSchema.virtual('canPostJobs').get(function () {
  return ['verified', 'pending'].includes(this.status);
});

// Methods cần thiết
EmployerProfileSchema.methods.addMember = function (
  userId,
  role = 'recruiter'
) {
  this.members.push({
    user: userId,
    role: role,
    status: 'pending',
  });
  return this.save();
};

EmployerProfileSchema.methods.updateMemberPermissions = function (
  userId,
  permissions
) {
  const member = this.members.find(m => m.user.toString() === userId);
  if (member) {
    Object.assign(member.permissions, permissions);
    return this.save();
  }
  throw new Error('Member not found');
};

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
