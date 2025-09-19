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
  try {
    // 🔧 DEFENSIVE: Ensure verification object exists
    if (!this.verification) {
      this.verification = {
        isVerified: false,
        steps: {
          basicInfo: false,
          businessInfo: false,
          adminApproved: false,
        },
        documents: [],
        adminNotes: [],
      };
    }

    // 🔧 DEFENSIVE: Ensure steps object exists
    if (!this.verification.steps) {
      this.verification.steps = {
        basicInfo: false,
        businessInfo: false,
        adminApproved: false,
      };
    }

    const steps = this.verification.steps;

    // Update basic info step - with optional chaining
    if (
      this.company?.name &&
      this.company?.industry &&
      this.company?.size &&
      this.contact?.name &&
      this.contact?.phone
    ) {
      steps.basicInfo = true;
    }

    // Update business info step - with optional chaining
    if (
      this.businessInfo?.registrationNumber &&
      this.businessInfo?.taxId &&
      this.businessInfo?.issueDate &&
      this.businessInfo?.issuePlace
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
  } catch (error) {
    console.error('❌ EmployerProfile pre-save middleware error:', error);
    console.error('Profile data:', {
      id: this._id,
      mainUserId: this.mainUserId,
      hasVerification: !!this.verification,
      hasSteps: !!this.verification?.steps,
    });
    next(error);
  }
});

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
