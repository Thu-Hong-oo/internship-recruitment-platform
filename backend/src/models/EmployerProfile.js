const mongoose = require('mongoose');
const {
  USER_ROLES,
  EMPLOYER_PROFILE_STATUS,
} = require('../constants/common.constants');

// Import sub-schemas
const CompanyInfoSchema = require('./schemas/CompanyInfoSchema');
const BusinessInfoSchema = require('./schemas/BusinessInfoSchema');
const VerificationSchema = require('./schemas/VerificationSchema');

// Import services
const EmployerDocumentService = require('../services/EmployerDocumentService');
const EmployerVerificationService = require('../services/EmployerVerificationService');

const EmployerProfileSchema = new mongoose.Schema(
  {
    // Chủ tài khoản
    mainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Thông tin công ty - sử dụng sub-schema
    company: CompanyInfoSchema,

    // Thông tin pháp lý - sử dụng sub-schema
    businessInfo: BusinessInfoSchema,

    // Người đại diện pháp luật - simplified
    legalRepresentative: {
      fullName: { type: String, required: true },
      position: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      identification: {
        type: {
          type: String,
          enum: ['CMND', 'CCCD', 'Passport'],
          required: false,
        },
        number: { type: String, required: false },
        issueDate: { type: Date, required: false },
        issuePlace: { type: String, required: false },
        required: { type: Boolean, default: false },
        requiredReason: String,
      },
    },

    // Liên hệ chính
    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, lowercase: true },
    },

    // Thành viên công ty - simplified
    companyMembers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: Object.values(USER_ROLES),
          default: USER_ROLES.RECRUITER,
        },
        permissions: {
          canPostJobs: { type: Boolean, default: false },
          canViewApplications: { type: Boolean, default: false },
          canEditProfile: { type: Boolean, default: false },
          canManageTeam: { type: Boolean, default: false },
        },
        status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Xác thực - sử dụng sub-schema
    verification: VerificationSchema,

    // Status
    status: {
      type: String,
      enum: Object.values(EMPLOYER_PROFILE_STATUS),
      default: EMPLOYER_PROFILE_STATUS.DRAFT,
    },

    // Thống kê
    stats: {
      totalJobsPosted: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      successfulHires: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// === INDEXES ===
EmployerProfileSchema.index({ 'company.name': 1 });
EmployerProfileSchema.index({ 'company.industry': 1 });
EmployerProfileSchema.index({ 'businessInfo.taxId': 1 }, { unique: true });
EmployerProfileSchema.index({ status: 1 });
EmployerProfileSchema.index({ 'verification.isVerified': 1 });

// === VIRTUALS ===
EmployerProfileSchema.virtual('isHiring').get(function () {
  return this.stats.activeJobs > 0;
});

EmployerProfileSchema.virtual('verificationProgress').get(function () {
  const service = new EmployerVerificationService(this);
  return service.getVerificationProgress();
});

// === ESSENTIAL METHODS ONLY ===
EmployerProfileSchema.methods.updateStats = function (totalJobs, activeJobs) {
  this.stats.totalJobsPosted = totalJobs;
  this.stats.activeJobs = activeJobs;
  return this.save();
};

// Service getters - để access services
EmployerProfileSchema.methods.getDocumentService = function () {
  return new EmployerDocumentService(this);
};

EmployerProfileSchema.methods.getVerificationService = function () {
  return new EmployerVerificationService(this);
};

// === STATIC METHODS ===
EmployerProfileSchema.statics.findVerified = function () {
  return this.find({
    'verification.isVerified': true,
    status: EMPLOYER_PROFILE_STATUS.VERIFIED,
  });
};

EmployerProfileSchema.statics.findByIndustry = function (industry) {
  return this.find({ 'company.industry': { $regex: industry, $options: 'i' } });
};

EmployerProfileSchema.statics.findCanPostJobs = function () {
  return this.find({
    status: {
      $in: [EMPLOYER_PROFILE_STATUS.VERIFIED, EMPLOYER_PROFILE_STATUS.PENDING],
    },
  });
};

// === PRE-SAVE MIDDLEWARE ===
EmployerProfileSchema.pre('save', function (next) {
  const steps = this.verification.steps;

  // Update basic info step
  if (
    this.company.name &&
    this.company.industry &&
    this.company.size &&
    this.contact.name &&
    this.contact.phone
  ) {
    steps.basicInfo = true;
  }

  // Update business info step
  if (
    this.businessInfo.registrationNumber &&
    this.businessInfo.taxId &&
    this.businessInfo.issueDate &&
    this.businessInfo.issuePlace
  ) {
    steps.businessInfo = true;
  }

  // Update status based on steps
  if (steps.basicInfo && steps.businessInfo) {
    if (this.status === EMPLOYER_PROFILE_STATUS.DRAFT) {
      this.status = EMPLOYER_PROFILE_STATUS.PENDING;
    }
  }

  if (steps.adminApproved && this.verification.isVerified) {
    this.status = EMPLOYER_PROFILE_STATUS.VERIFIED;
  }

  next();
});

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
