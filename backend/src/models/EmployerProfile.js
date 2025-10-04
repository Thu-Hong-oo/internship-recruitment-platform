const mongoose = require('mongoose');
const {
  USER_ROLES,
  EMPLOYER_PROFILE_STATUS,
} = require('../constants/common.constants');

// Giữ nguyên sub-schemas nhưng tối ưu
const CompanyInfoSchema = require('./schemas/CompanyInfoSchema');
const BusinessInfoSchema = require('./schemas/BusinessInfoSchema');
const VerificationSchema = require('./schemas/VerificationSchema');
const EmployerDocumentService = require('../services/employers/employerDocumentService');
const EmployerVerificationService = require('../services/employers/employerVerificationService');

const EmployerProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    company: CompanyInfoSchema,
    businessInfo: BusinessInfoSchema,

    position: {
      title: { type: String, default: '' },
      level: { type: String, default: '' },
      department: { type: String, default: '' },
    },

    legalRepresentative: {
      fullName: { type: String, required: true },
      position: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      identification: {
        type: {
          type: String,
          enum: ['CMND', 'CCCD', 'Passport'],
        },
        number: String,
        issueDate: Date,
        issuePlace: String,
      },
    },

    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
    },

    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: ['owner', 'admin', 'hr', 'recruiter', 'interviewer'],
          default: 'recruiter',
        },
        permissions: {
          // Job management
          canCreateJobs: { type: Boolean, default: true },
          canEditJobs: { type: Boolean, default: true },
          canDeleteJobs: { type: Boolean, default: false },
          canPublishJobs: { type: Boolean, default: true },

          // Application management
          canViewApplications: { type: Boolean, default: true },
          canReviewApplications: { type: Boolean, default: true },
          canRejectApplications: { type: Boolean, default: true },
          canScheduleInterviews: { type: Boolean, default: true },
          canSendOffers: { type: Boolean, default: false },

          // Candidate management
          canSearchCandidates: { type: Boolean, default: true },
          canViewCandidateDetails: { type: Boolean, default: true },
          canContactCandidates: { type: Boolean, default: true },
          canSaveCandidates: { type: Boolean, default: true },

          // Company management
          canEditProfile: { type: Boolean, default: false },
          canManageTeam: { type: Boolean, default: false },
          canManageBilling: { type: Boolean, default: false },

          // Analytics
          canViewAnalytics: { type: Boolean, default: false },
          canExportData: { type: Boolean, default: false },

          // AI features
          canUseAIMatching: { type: Boolean, default: true },
          canUseAIScreening: { type: Boolean, default: false },
        },
        status: {
          type: String,
          enum: ['active', 'inactive', 'pending', 'suspended'],
          default: 'pending',
        },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        invitedAt: { type: Date, default: Date.now },
        joinedAt: Date,
        lastActive: Date,
        activity: {
          jobsCreated: { type: Number, default: 0 },
          applicationsReviewed: { type: Number, default: 0 },
          interviewsScheduled: { type: Number, default: 0 },
        },
      },
    ],

    verification: {
      type: VerificationSchema,
      default: () => ({})
    },

    status: {
      type: String,
      enum: Object.values(EMPLOYER_PROFILE_STATUS),
      default: EMPLOYER_PROFILE_STATUS.DRAFT,
    },

    stats: {
      totalJobs: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      successfulHires: { type: Number, default: 0 },
      activeMembers: { type: Number, default: 1 },
    },

    // AI & Analytics
    ai: {
      companyEmbedding: [Number],

      industryAnalysis: {
        primaryIndustry: String,
        subIndustries: [String],
        confidence: Number,
        analyzedAt: Date,
      },

      cultureProfile: {
        keywords: [String],
        values: [String],
        workStyle: {
          type: String,
          enum: ['formal', 'casual', 'startup', 'corporate', 'hybrid'],
        },
      },

      hiringTrends: {
        averageTimeToHire: Number,
        acceptanceRate: Number,
        topSourceChannels: [String],
        seasonalPatterns: [
          {
            month: Number,
            hiringCount: Number,
          },
        ],
      },
    },

    // Reputation & Reviews
    reputation: {
      rating: {
        overall: { type: Number, min: 0, max: 5, default: 0 },
        culture: { type: Number, min: 0, max: 5 },
        benefits: { type: Number, min: 0, max: 5 },
        management: { type: Number, min: 0, max: 5 },
        workLifeBalance: { type: Number, min: 0, max: 5 },
      },
      reviewCount: { type: Number, default: 0 },
      wouldRecommend: Number,
      responseRate: Number,
      lastReviewAt: Date,
    },

    // Engagement metrics
    engagement: {
      profileViews: { type: Number, default: 0 },
      jobViews: { type: Number, default: 0 },
      applicationRate: Number,
      responseTime: {
        average: Number,
        median: Number,
      },
      candidateSatisfaction: Number,
    },

    // Subscription (if premium features)
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free',
      },

      features: {
        maxActiveJobs: { type: Number, default: 3 },
        maxTeamMembers: { type: Number, default: 1 },
        canUseAI: { type: Boolean, default: false },
        canSeeCandidateContact: { type: Boolean, default: false },
        canAccessAnalytics: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
      },

      billing: {
        startDate: Date,
        endDate: Date,
        autoRenew: { type: Boolean, default: true },
        paymentMethod: String,
      },

      usage: {
        jobsPostedThisMonth: { type: Number, default: 0 },
        aiCreditsUsed: { type: Number, default: 0 },
        aiCreditsLimit: { type: Number, default: 0 },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES
// ============================================

EmployerProfileSchema.index({ owner: 1 }, { unique: true });
EmployerProfileSchema.index({ 'company.name': 'text' });
EmployerProfileSchema.index({ 'company.industry': 1 });
EmployerProfileSchema.index({ 'company.email': 1 });
EmployerProfileSchema.index({ 'businessInfo.taxId': 1 }, { unique: true });
EmployerProfileSchema.index({ status: 1, 'verification.isVerified': 1 });
EmployerProfileSchema.index({ 'members.user': 1 });
EmployerProfileSchema.index({ 'subscription.plan': 1 });
EmployerProfileSchema.index({ 'reputation.rating.overall': -1 });
EmployerProfileSchema.index({ 'ai.industryAnalysis.primaryIndustry': 1 });
EmployerProfileSchema.index({ createdAt: -1 });

// ============================================
// VIRTUALS
// ============================================

EmployerProfileSchema.virtual('isVerified').get(function () {
  return (
    this.verification?.isVerified &&
    this.status === EMPLOYER_PROFILE_STATUS.VERIFIED
  );
});

EmployerProfileSchema.virtual('canPostJobs').get(function () {
  return [
    EMPLOYER_PROFILE_STATUS.VERIFIED,
    EMPLOYER_PROFILE_STATUS.PENDING,
  ].includes(this.status);
});

EmployerProfileSchema.virtual('subscriptionActive').get(function () {
  if (!this.subscription?.billing?.endDate) return false;
  return new Date() < this.subscription.billing.endDate;
});

// ============================================
// INSTANCE METHODS
// ============================================

// Add team member
EmployerProfileSchema.methods.addMember = function (
  userId,
  role = 'recruiter'
) {
  const exists = this.members.some(
    m => m.user.toString() === userId.toString()
  );
  if (exists) {
    throw new Error('User already is a team member');
  }

  this.members.push({
    user: userId,
    role: role,
    status: 'pending',
  });
  return this.save();
};

// Remove team member
EmployerProfileSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(
    m => m.user.toString() !== userId.toString()
  );
  return this.save();
};

// Check permission
EmployerProfileSchema.methods.userCan = function (userId, permission) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString() && m.status === 'active'
  );

  if (!member) return false;
  if (member.role === 'owner') return true;

  return member.permissions[permission] === true;
};

// Get active members
EmployerProfileSchema.methods.getActiveMembers = function () {
  return this.members.filter(m => m.status === 'active');
};

// Check if can post new job
EmployerProfileSchema.methods.canPostNewJob = function () {
  if (!this.subscription) return this.stats.activeJobs < 3;
  return this.stats.activeJobs < this.subscription.features.maxActiveJobs;
};

// Update stats
EmployerProfileSchema.methods.updateStats = async function () {
  const Job = mongoose.model('Job');
  const Application = mongoose.model('Application');

  this.stats.totalJobs = await Job.countDocuments({ employer: this._id });
  this.stats.activeJobs = await Job.countDocuments({
    employer: this._id,
    status: 'active',
  });

  const jobs = await Job.find({ employer: this._id }).select('_id');
  const jobIds = jobs.map(j => j._id);

  this.stats.totalApplications = await Application.countDocuments({
    jobId: { $in: jobIds },
  });

  this.stats.activeMembers = this.members.filter(
    m => m.status === 'active'
  ).length;

  return this.save();
};

// Increment profile view
EmployerProfileSchema.methods.incrementView = async function () {
  this.engagement.profileViews += 1;
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

EmployerProfileSchema.statics.findVerified = function () {
  return this.find({
    'verification.isVerified': true,
    status: EMPLOYER_PROFILE_STATUS.VERIFIED,
  });
};

EmployerProfileSchema.statics.findByIndustry = function (industry) {
  return this.find({
    'company.industry': { $regex: industry, $options: 'i' },
    status: EMPLOYER_PROFILE_STATUS.VERIFIED,
  });
};

EmployerProfileSchema.statics.findCanPostJobs = function () {
  return this.find({
    status: {
      $in: [EMPLOYER_PROFILE_STATUS.VERIFIED, EMPLOYER_PROFILE_STATUS.PENDING],
    },
  });
};

EmployerProfileSchema.statics.search = function (query) {
  return this.find({
    $text: { $search: query },
    status: EMPLOYER_PROFILE_STATUS.VERIFIED,
  }).sort({ 'reputation.rating.overall': -1 });
};

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

EmployerProfileSchema.pre('save', async function (next) {
  try {
    // Ensure verification object exists
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

    if (!this.verification.steps) {
      this.verification.steps = {
        basicInfo: false,
        businessInfo: false,
        adminApproved: false,
      };
    }

    const steps = this.verification.steps;

    // Update basic info step
    if (
      this.company?.name &&
      this.company?.industry &&
      this.company?.size &&
      this.contact?.name &&
      this.contact?.phone
    ) {
      steps.basicInfo = true;
    }

    // Update business info step
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

    // Auto-expire pending invitations
    if (this.isModified('members')) {
      const now = new Date();
      const INVITATION_EXPIRY_DAYS = 7;

      this.members = this.members.filter(member => {
        if (member.status === 'pending') {
          const daysSinceInvite =
            (now - member.invitedAt) / (1000 * 60 * 60 * 24);
          return daysSinceInvite <= INVITATION_EXPIRY_DAYS;
        }
        return true;
      });

      // Update active members count
      this.stats.activeMembers = this.members.filter(
        m => m.status === 'active'
      ).length;
    }

    next();
  } catch (error) {
    console.error('EmployerProfile pre-save error:', error);
    next(error);
  }
});

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);