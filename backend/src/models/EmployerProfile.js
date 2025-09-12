const mongoose = require('mongoose');

const EmployerProfileSchema = new mongoose.Schema(
  {
    mainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyMembers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['owner', 'admin', 'recruiter', 'interviewer'],
        default: 'recruiter'
      },
      permissions: {
        canPostJobs: Boolean,
        canViewApplications: Boolean,
        canEditProfile: Boolean,
        canManageTeam: Boolean,
        canVerifyDocuments: Boolean
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
      }
    }],
    company: {
      name: {
        type: String,
        required: true,
      },
      industry: {
        type: String,
        required: true,
      },
      size: {
        type: String,
        enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
        required: true,
      },
      website: String,
      description: String,
      foundedYear: Number,
      headquarters: {
        city: String,
        country: String,
      },
    },
    position: {
      title: {
        type: String,
        required: true,
      },
      department: String,
      level: {
        type: String,
        enum: [
          'junior',
          'mid-level',
          'senior',
          'manager',
          'director',
          'executive',
        ],
        required: true,
      },
      responsibilities: [String],
      hiringAuthority: {
        type: Boolean,
        default: false,
      },
    },
    contact: {
      name: {
        type: String,
        trim: true,
      },
      phone: String,
      linkedin: String,
      workEmail: String,
      availability: {
        type: String,
        enum: ['weekdays', 'weekends', 'flexible'],
        default: 'weekdays',
      },
    },
    preferences: {
      internshipTypes: [
        {
          type: String,
          enum: ['full-time', 'part-time', 'remote', 'hybrid'],
        },
      ],
      durations: [
        {
          type: String,
          enum: ['3-months', '6-months', '1-year', 'flexible'],
        },
      ],
      locations: [String],
      skills: [
        {
          skillId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill',
          },
          priority: {
            type: String,
            enum: ['required', 'preferred', 'bonus'],
            default: 'preferred',
          },
        },
      ],
      salaryRange: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'VND',
        },
      },
    },
    hiring: {
      totalPositions: {
        type: Number,
        default: 0,
      },
      activePositions: {
        type: Number,
        default: 0,
      },
      averageHiringTime: {
        type: Number, // days
        default: 30,
      },
      successRate: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0,
      },
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      documents: [
        {
          type: {
            type: String,
            enum: [
              'business-license',
              'tax-certificate',
              'company-registration',
            ],
            required: true,
          },
          url: String,
          filename: String,
          uploadedAt: Date,
          verified: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmployerProfileSchema.index({ userId: 1 });
EmployerProfileSchema.index({ 'company.name': 1 });
EmployerProfileSchema.index({ 'company.industry': 1 });
EmployerProfileSchema.index({ 'company.size': 1 });
EmployerProfileSchema.index({ 'position.level': 1 });
EmployerProfileSchema.index({ 'verification.isVerified': 1 });
EmployerProfileSchema.index({ status: 1 });

// Virtuals
EmployerProfileSchema.virtual('isHiring').get(function () {
  return this.hiring.activePositions > 0;
});

EmployerProfileSchema.virtual('hiringRate').get(function () {
  if (this.hiring.totalPositions === 0) return 0;
  return Math.round(
    (this.hiring.successRate / 100) * this.hiring.totalPositions
  );
});

// Methods
EmployerProfileSchema.methods.addDocument = function (type, url, filename) {
  this.verification.documents.push({
    type,
    url,
    filename,
    uploadedAt: new Date(),
  });
  return this.save();
};

EmployerProfileSchema.methods.verifyDocument = function (documentId) {
  const document = this.verification.documents.id(documentId);
  if (document) {
    document.verified = true;
    return this.save();
  }
  throw new Error('Document not found');
};

EmployerProfileSchema.methods.updateHiringStats = function (
  totalPositions,
  activePositions,
  successRate
) {
  this.hiring.totalPositions = totalPositions;
  this.hiring.activePositions = activePositions;
  this.hiring.successRate = successRate;
  return this.save();
};

// Methods for team management
EmployerProfileSchema.methods.addTeamMember = function(userId, role, permissions) {
  const member = {
    userId,
    role,
    permissions,
    addedBy: this.mainUserId,
    addedAt: new Date()
  };
  this.companyMembers.push(member);
  return this.save();
};

EmployerProfileSchema.methods.updateMemberPermissions = function(userId, newPermissions) {
  const member = this.companyMembers.find(m => m.userId.equals(userId));
  if (member) {
    member.permissions = {...member.permissions, ...newPermissions};
    return this.save();
  }
  throw new Error('Member not found');
};

EmployerProfileSchema.methods.removeMember = function(userId) {
  this.companyMembers = this.companyMembers.filter(m => !m.userId.equals(userId));
  return this.save();
};

EmployerProfileSchema.methods.getMemberRole = function(userId) {
  const member = this.companyMembers.find(m => m.userId.equals(userId));
  return member ? member.role : null;
};

// Statics
EmployerProfileSchema.statics.findVerified = function () {
  return this.find({ 'verification.isVerified': true, status: 'active' });
};

EmployerProfileSchema.statics.findByIndustry = function (industry) {
  return this.find({ 'company.industry': { $regex: industry, $options: 'i' } });
};

EmployerProfileSchema.statics.findHiring = function () {
  return this.find({ 'hiring.activePositions': { $gt: 0 } });
};

EmployerProfileSchema.statics.findByLocation = function (location) {
  return this.find({
    'preferences.locations': { $regex: location, $options: 'i' },
  });
};

// Pre-save middleware
EmployerProfileSchema.pre('save', function (next) {
  // Auto-verify if all required documents are uploaded
  if (this.verification.documents.length >= 2) {
    const requiredDocs = ['business-license', 'tax-certificate'];
    const hasRequiredDocs = requiredDocs.every(docType =>
      this.verification.documents.some(
        doc => doc.type === docType && doc.verified
      )
    );

    if (hasRequiredDocs && !this.verification.isVerified) {
      this.verification.isVerified = true;
      this.verification.verifiedAt = new Date();
      this.status = 'active';
    }
  }

  next();
});

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
