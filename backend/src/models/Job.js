const mongoose = require('mongoose');
const {
  JOB_STATUS,
  POSTED_BY_TYPES,
  JOB_TYPES,
  JOB_CATEGORIES,
  LOCATION_TYPES,
  WORK_SCHEDULES,
  DURATION_UNITS,
  CURRENCY_TYPES,
  SALARY_PERIODS,
  APPLICATION_METHODS,
  EDUCATION_LEVELS,
  TEAM_ROLES,
} = require('../constants/common.constants');

/**
 * Job Schema for Internship Recruitment Platform
 *
 * SCHEMA OPTIMIZATION NOTES:
 * ========================
 *
 * 1. PERFORMANCE CONSIDERATIONS:
 *    - Heavy fields (nlpAnalysis, statistics) may need separate collections for large scale
 *    - Consider horizontal partitioning by company/date for millions of jobs
 *    - Use projection to exclude heavy fields in list queries
 *
 * 2. INDEXING STRATEGY:
 *    - All indexes point to existing fields only
 *    - Compound indexes for common query patterns
 *    - Text index for search functionality
 *
 * 3. DATA CONSISTENCY:
 *    - Single source of truth: statistics (not stats)
 *    - Virtual fields for backward compatibility
 *    - Atomic updates using MongoDB transactions where needed
 *
 * 4. FUTURE SCALING OPTIONS:
 *    - Move statistics to separate collection with job references
 *    - Extract nlpAnalysis to ML service with async updates
 *    - Consider sharding by employer or geographic region
 *
 * 5. MEMORY OPTIMIZATION:
 *    - Use lean() queries when full model features not needed
 *    - Implement field selection in API responses
 *    - Consider archiving old jobs to separate collection
 */

const JobSchema = new mongoose.Schema(
  {
    // =============================================================================
    // CORE FIELDS - Essential job information (always loaded)
    // =============================================================================

    // ✅ Support multiple posting sources
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: function () {
        return this.postedByType === 'employer';
      },
    },

    // ✅ Add postedBy to track who actually created the job
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'postedByType',
      required: true,
    },

    // ✅ Support different poster types for future expansion
    postedByType: {
      type: String,
      required: true,
      enum: Object.values(POSTED_BY_TYPES), // Flexible for future
      default: POSTED_BY_TYPES.USER,
    },

    // ✅ Job classification - simple and expandable
    jobType: {
      type: String,
      required: true,
      enum: Object.values(JOB_TYPES),
      default: JOB_TYPES.INTERNSHIP,
    },

    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề công việc'],
      trim: true,
      maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự'],
    },

    description: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả công việc'],
      maxlength: [5000, 'Mô tả không được vượt quá 5000 ký tự'],
    },

    // ✅ Simplified category system for easy posting
    category: {
      type: String,
      required: true,
      enum: Object.values(JOB_CATEGORIES),
    },

    // ✅ Optional subcategories for more specific filtering
    subCategories: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 3; // Max 3 subcategories
        },
        message: 'Chỉ được chọn tối đa 3 chuyên môn phụ',
      },
    },

    // ✅ Simple tags for additional filtering
    tags: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5; // Max 5 tags
        },
        message: 'Chỉ được thêm tối đa 5 tags',
      },
    },

    // ✅ Simplified location - easy for employers to fill
    location: {
      city: {
        type: String,
        required: true,
      },
      district: String,
      address: String,
      type: {
        type: String,
        enum: Object.values(LOCATION_TYPES),
        default: LOCATION_TYPES.ONSITE,
      },
      // ✅ Support multiple locations for large companies
      allowMultiple: {
        type: Boolean,
        default: false,
      },
    },

    // ✅ Unified work details - covers both internship and full-time
    workDetails: {
      // Work type and schedule
      schedule: {
        type: String,
        enum: Object.values(WORK_SCHEDULES),
        default: WORK_SCHEDULES.FULL_TIME,
      },

      // Duration (mainly for internships)
      duration: {
        value: Number, // 3, 6, 12
        unit: {
          type: String,
          enum: Object.values(DURATION_UNITS),
          default: DURATION_UNITS.MONTHS,
        },
        isPermanent: {
          type: Boolean,
          default: false, // true for full-time jobs
        },
      },

      // Start date
      startDate: {
        type: Date,
        default: function () {
          // Default to 2 weeks from now
          return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        },
      },

      // How many people to hire
      positions: {
        type: Number,
        default: 1,
        min: 1,
      },
    },

    // ✅ Simplified salary info - easy to fill
    compensation: {
      isPaid: {
        type: Boolean,
        default: true,
      },

      salary: {
        amount: Number,
        currency: {
          type: String,
          default: CURRENCY_TYPES.VND,
        },
        period: {
          type: String,
          enum: Object.values(SALARY_PERIODS),
          default: SALARY_PERIODS.MONTH,
        },
        negotiable: {
          type: Boolean,
          default: false,
        },
      },

      // Additional benefits (optional)
      benefits: [String], // ['Lunch allowance', 'Transportation', 'Learning budget']
    },

    // ✅ Simple application process
    application: {
      deadline: {
        type: Date,
        default: function () {
          // Default to 30 days from now
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        },
      },

      // How to apply
      method: {
        type: String,
        enum: Object.values(APPLICATION_METHODS),
        default: APPLICATION_METHODS.PLATFORM,
      },

      // External application info (if not using platform)
      externalInfo: {
        email: String,
        website: String,
        phone: String,
        instructions: String,
      },

      // What candidates need to submit
      requirements: {
        cv: { type: Boolean, default: true },
        coverLetter: { type: Boolean, default: false },
        portfolio: { type: Boolean, default: false },
        transcript: { type: Boolean, default: false },
        other: [String], // ['Design portfolio', 'Code samples']
      },
    },

    // ✅ Simplified requirements - easy for employers
    requirements: {
      // Education
      education: {
        level: {
          type: String,
          enum: Object.values(EDUCATION_LEVELS),
          default: EDUCATION_LEVELS.UNIVERSITY,
        },
        majors: [String], // ['Computer Science', 'Information Technology']
        yearOfStudy: [String], // ['2', '3', '4'] for current students
      },

      // Experience
      experience: {
        required: {
          type: Boolean,
          default: false,
        },
        years: {
          type: Number,
          min: 0,
          default: 0,
        },
        description: String,
      },

      // Skills (simplified)
      skills: {
        required: [String], // Must-have skills
        preferred: [String], // Nice-to-have skills
      },

      // Other requirements
      languages: [String], // ['Vietnamese', 'English']
      other: [String], // ['Own laptop', 'Available full-time']
    },

    // ✅ Keep only essential fields that employers actually fill
    // Note: stats field removed to avoid duplication with statistics
    // Use virtual 'stats' for backward compatibility

    benefits: {
      salary: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: CURRENCY_TYPES.VND,
        },
        negotiable: Boolean,
      },
      perks: [String],
      training: String,
      opportunities: [String],
    },

    // ✅ Simplified status for easy management
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.DRAFT,
    },

    // ✅ Optional advanced fields for complex use cases
    advanced: {
      // For complex organizations
      department: String,
      reportingTo: String,

      // For detailed analytics (optional)
      targetAudience: [String], // ['fresh-graduates', 'students', 'career-changers']

      // For premium features
      featured: {
        type: Boolean,
        default: false,
      },
      urgent: {
        type: Boolean,
        default: false,
      },
    },

    // =============================================================================
    // ANALYTICS & HEAVY FIELDS - Consider separate collection for scale
    // =============================================================================

    statistics: {
      views: {
        type: Number,
        default: 0,
      },
      applications: {
        total: {
          type: Number,
          default: 0,
        },
        pending: {
          type: Number,
          default: 0,
        },
        reviewing: {
          type: Number,
          default: 0,
        },
        shortlisted: {
          type: Number,
          default: 0,
        },
        interviewed: {
          type: Number,
          default: 0,
        },
        offered: {
          type: Number,
          default: 0,
        },
        accepted: {
          type: Number,
          default: 0,
        },
        rejected: {
          type: Number,
          default: 0,
        },
      },
    },

    nlpAnalysis: {
      // Note: Consider moving to separate collection for better performance
      keywords: [String],
      requiredSkills: [
        {
          name: String,
          confidence: Number,
          context: String,
        },
      ],
      suggestedCandidates: [
        {
          internId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CandidateProfile',
          },
          score: Number,
          matchingSkills: [String],
        },
      ],
      analyzedAt: Date,
    },

    // =============================================================================
    // TEAM & WORKFLOW - Administrative fields
    // =============================================================================

    // ✅ Add team management and tracking fields
    teamAccess: {
      allowedMembers: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          role: {
            type: String,
            enum: Object.values(TEAM_ROLES),
          },
          permissions: {
            canEdit: { type: Boolean, default: false },
            canViewApplications: { type: Boolean, default: true },
            canManageApplications: { type: Boolean, default: false },
          },
          addedAt: { type: Date, default: Date.now },
        },
      ],
      isPublicToTeam: { type: Boolean, default: true }, // All company members can view
    },

    // ✅ Add workflow tracking
    workflow: {
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      lastEditedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedAt: Date,
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectedAt: Date,
      rejectionReason: String,
    },

    // ✅ Add versioning for job changes
    version: {
      type: Number,
      default: 1,
    },

    // ✅ Add moderation info
    moderation: {
      flagged: { type: Boolean, default: false },
      flagReason: String,
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      flaggedAt: Date,
      adminNotes: [
        {
          note: String,
          addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          addedAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes - Fixed to match actual schema structure
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ employer: 1 });
JobSchema.index({ postedBy: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ subCategories: 1 });
JobSchema.index({ 'location.city': 1 });
JobSchema.index({ 'location.district': 1 });
JobSchema.index({ 'location.type': 1 });
JobSchema.index({ 'workDetails.schedule': 1 }); // Fixed: was 'internship.type'
JobSchema.index({ 'compensation.isPaid': 1 }); // Fixed: was 'internship.isPaid'
JobSchema.index({ 'requirements.skills.required': 1 }); // Fixed: was 'requirements.skills.name'
JobSchema.index({ 'requirements.skills.preferred': 1 }); // Add index for preferred skills
JobSchema.index({ 'requirements.education.majors': 1 }); // Fixed: was 'requirements.majors'
JobSchema.index({ 'requirements.education.yearOfStudy': 1 }); // Fixed: was 'requirements.yearOfStudy'
JobSchema.index({ tags: 1 });
// Removed: JobSchema.index({ 'details.locations.city': 1 }); - field doesn't exist
JobSchema.index({ 'teamAccess.allowedMembers.userId': 1 });
JobSchema.index({ 'workflow.lastEditedBy': 1 });
JobSchema.index({ 'moderation.flagged': 1 });
JobSchema.index({ createdAt: -1 });

// ✅ Add virtual for backward compatibility with old queries
JobSchema.virtual('internship').get(function () {
  return {
    type: this.workDetails?.schedule,
    isPaid: this.compensation?.isPaid,
    salary: {
      amount: this.compensation?.salary?.amount,
    },
    startDate: this.workDetails?.startDate,
  };
});

// ✅ Add virtual for backward compatibility - stats field
JobSchema.virtual('stats').get(function () {
  return {
    views: this.statistics?.views || 0,
    applications: this.statistics?.applications?.total || 0,
  };
});

// ✅ Add virtual for remaining days until deadline
JobSchema.virtual('remainingDays').get(function () {
  if (!this.application?.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.application.deadline);
  const diffTime = deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ✅ Add virtual for compatibility with existing details.applicationDeadline
JobSchema.virtual('daysLeft').get(function () {
  const deadline = this.application?.deadline;
  if (!deadline) return null;
  const now = new Date();
  const diffTime = new Date(deadline) - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ✅ Add virtual for expired check
JobSchema.virtual('isExpired').get(function () {
  const deadline = this.application?.deadline;
  if (!deadline) return false;
  return new Date() > new Date(deadline);
});

//   Add virtual for easy category checking
JobSchema.virtual('isInternship').get(function () {
  return this.jobType === JOB_TYPES.INTERNSHIP;
});

JobSchema.virtual('isFullTime').get(function () {
  return this.jobType === JOB_TYPES.FULL_TIME;
});

// Methods
JobSchema.methods.updateStatistics = async function () {
  const Application = mongoose.model('Application');

  const stats = await Application.aggregate([
    { $match: { jobId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  stats.forEach(stat => {
    this.statistics.applications[stat._id] = stat.count;
  });

  this.statistics.applications.total = stats.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  return this.save();
};

JobSchema.methods.incrementViews = async function () {
  this.statistics.views += 1;
  return this.save();
};

//   Team management methods
JobSchema.methods.canUserAccess = function (userId, action = 'view') {
  const userIdStr = userId.toString();

  // Owner always has full access
  if (this.postedBy.toString() === userIdStr) return true;

  // Check if user is in allowed members
  const memberAccess = this.teamAccess.allowedMembers.find(
    member => member.userId.toString() === userIdStr
  );

  if (!memberAccess) {
    // If public to team, allow view access for all company members
    return action === 'view' && this.teamAccess.isPublicToTeam;
  }

  // Check specific permissions
  switch (action) {
    case 'edit':
      return memberAccess.permissions.canEdit;
    case 'manageApplications':
      return memberAccess.permissions.canManageApplications;
    case 'viewApplications':
      return memberAccess.permissions.canViewApplications;
    case 'view':
    default:
      return true; // If user is in allowedMembers, they can view
  }
};

JobSchema.methods.addTeamMember = function (userId, role, permissions = {}) {
  // Remove existing if present
  this.teamAccess.allowedMembers = this.teamAccess.allowedMembers.filter(
    member => member.userId.toString() !== userId.toString()
  );

  // Add new member
  this.teamAccess.allowedMembers.push({
    userId,
    role,
    permissions: {
      canEdit: permissions.canEdit || false,
      canViewApplications: permissions.canViewApplications !== false, // default true
      canManageApplications: permissions.canManageApplications || false,
    },
  });

  return this;
};

JobSchema.methods.removeTeamMember = function (userId) {
  this.teamAccess.allowedMembers = this.teamAccess.allowedMembers.filter(
    member => member.userId.toString() !== userId.toString()
  );
  return this;
};

JobSchema.methods.updateWorkflow = function (userId, action, data = {}) {
  this.workflow.lastEditedBy = userId;
  this.workflow.lastEditedAt = new Date();

  if (action === 'approve') {
    this.workflow.approvedBy = userId;
    this.workflow.approvedAt = new Date();
    this.status = JOB_STATUS.ACTIVE;
  } else if (action === 'reject') {
    this.workflow.rejectedBy = userId;
    this.workflow.rejectedAt = new Date();
    this.workflow.rejectionReason = data.reason;
    this.status = JOB_STATUS.REJECTED;
  } else if (action === 'edit') {
    this.version += 1;
  }

  return this;
};

JobSchema.methods.addModerationNote = function (note, userId) {
  if (!this.moderation) {
    this.moderation = { adminNotes: [] };
  }
  if (!this.moderation.adminNotes) {
    this.moderation.adminNotes = [];
  }

  this.moderation.adminNotes.push({
    note,
    addedBy: userId,
    addedAt: new Date(),
  });

  return this;
};

JobSchema.methods.flag = function (reason, userId) {
  this.moderation.flagged = true;
  this.moderation.flagReason = reason;
  this.moderation.flaggedBy = userId;
  this.moderation.flaggedAt = new Date();
  return this;
};

JobSchema.methods.unflag = function () {
  this.moderation.flagged = false;
  this.moderation.flagReason = undefined;
  this.moderation.flaggedBy = undefined;
  this.moderation.flaggedAt = undefined;
  return this;
};

//   Job creation helpers and defaults
const JobDefaults = {
  getDefaultCompensation: (data = {}) => ({
    isPaid: data.isPaid !== false, // Default to paid unless explicitly false
    salary: data.salary
      ? {
          amount: data.salary,
          period: data.salaryPeriod || SALARY_PERIODS.MONTH,
          currency: data.currency || CURRENCY_TYPES.VND,
          negotiable: data.negotiable || false,
        }
      : undefined,
  }),

  getDefaultWorkDetails: (data = {}) => ({
    positions: data.positions || 1,
    startDate: data.startDate,
    schedule: data.schedule || WORK_SCHEDULES.FULL_TIME,
    duration: data.duration
      ? {
          value: data.duration,
          unit: data.durationUnit || DURATION_UNITS.MONTHS,
          isPermanent: data.isPermanent || false,
        }
      : undefined,
  }),

  getDefaultLocation: (data = {}) => ({
    city: data.city,
    district: data.district,
    address: data.address,
    type: data.locationType || LOCATION_TYPES.ONSITE,
    allowMultiple: data.allowMultiple || false,
  }),

  getDefaultRequirements: (data = {}) => ({
    education: {
      level: data.educationLevel || EDUCATION_LEVELS.UNIVERSITY,
      majors: data.majors || [],
      yearOfStudy: data.yearOfStudy || [],
    },
    experience: {
      required: data.experienceRequired || false,
      years: data.experienceYears || 0,
      description: data.experienceDescription,
    },
    skills: {
      required: data.requiredSkills || [],
      preferred: data.preferredSkills || [],
    },
    languages: data.languages || [],
    other: data.otherRequirements || [],
  }),
};

//   Add simplified job creation helper
JobSchema.statics.createSimpleJob = function (data) {
  // Use helper functions for consistent defaults
  const jobData = {
    title: data.title,
    description: data.description,
    category: data.category,
    subCategories: data.subCategories || [],
    tags: data.tags || [],
    location: JobDefaults.getDefaultLocation(data),
    compensation: JobDefaults.getDefaultCompensation(data),
    workDetails: JobDefaults.getDefaultWorkDetails(data),
    requirements: JobDefaults.getDefaultRequirements(data),
    jobType: data.jobType || JOB_TYPES.INTERNSHIP,
    postedBy: data.postedBy,
    postedByType: data.postedByType || POSTED_BY_TYPES.USER,
    employer: data.employer,
    ...data, // Allow override of any field
  };

  return new this(jobData);
};

//   Add method to check if job is suitable for students
JobSchema.methods.isSuitableForStudents = function () {
  return (
    this.jobType === JOB_TYPES.INTERNSHIP ||
    this.workDetails?.schedule === WORK_SCHEDULES.PART_TIME ||
    this.requirements?.education?.yearOfStudy?.length > 0
  );
};

//   Add method to get display-friendly info
JobSchema.methods.getDisplayInfo = function () {
  return {
    title: this.title,
    company: this.employer?.company?.name || 'Company Name',
    location: `${this.location.city}${
      this.location.district ? ', ' + this.location.district : ''
    }`,
    type: `${this.jobType} - ${this.location.type}`,
    salary: this.compensation?.isPaid
      ? this.compensation?.salary?.amount
        ? `${this.compensation.salary.amount.toLocaleString()} ${
            this.compensation.salary.currency
          }/${this.compensation.salary.period}`
        : 'Có lương'
      : 'Không lương',
    deadline: this.application?.deadline,
    daysLeft: this.daysLeft,
  };
};

//   Static methods for queries
JobSchema.statics.findByTeamMember = function (userId) {
  return this.find({
    $or: [{ postedBy: userId }, { 'teamAccess.allowedMembers.userId': userId }],
  });
};

JobSchema.statics.findByTeamMemberWithCompany = function (
  userId,
  employerIds = []
) {
  return this.find({
    $or: [
      { postedBy: userId },
      { 'teamAccess.allowedMembers.userId': userId },
      {
        employer: { $in: employerIds },
        'teamAccess.isPublicToTeam': true,
      },
    ],
  });
};

JobSchema.statics.findByCompany = function (employerId) {
  return this.find({ employer: employerId });
};

JobSchema.statics.findPendingModeration = function () {
  return this.find({
    $or: [{ status: JOB_STATUS.PENDING }, { 'moderation.flagged': true }],
  });
};

// ✅ Add query methods for different job types
JobSchema.statics.findInternships = function () {
  return this.find({
    jobType: JOB_TYPES.INTERNSHIP,
    status: JOB_STATUS.ACTIVE,
  });
};

JobSchema.statics.findByCategory = function (category) {
  return this.find({ category, status: JOB_STATUS.ACTIVE });
};

JobSchema.statics.findForStudents = function () {
  return this.find({
    $or: [
      { jobType: JOB_TYPES.INTERNSHIP },
      { 'workDetails.schedule': WORK_SCHEDULES.PART_TIME },
      { 'requirements.education.yearOfStudy.0': { $exists: true } },
    ],
    status: JOB_STATUS.ACTIVE,
  });
};

//   Pre-save middleware
JobSchema.pre('save', function (next) {
  // Update workflow on status change
  if (this.isModified('status') && !this.workflow.lastEditedAt) {
    this.workflow.lastEditedAt = new Date();
  }

  next();
});

module.exports = mongoose.model('Job', JobSchema);

// Export helper functions for use in other modules
module.exports.JobDefaults = JobDefaults;
