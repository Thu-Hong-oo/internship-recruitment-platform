const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, 'Tiêu đề công việc là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Công ty là bắt buộc'],
    },

    // Job Type & Category
    jobType: {
      type: String,
      enum: ['internship', 'part-time', 'full-time', 'contract', 'freelance'],
      default: 'internship',
    },
    category: {
      type: String,
      enum: [
        'tech',
        'business',
        'marketing',
        'design',
        'data',
        'finance',
        'hr',
        'sales',
        'other',
      ],
      required: true,
    },
    subCategory: {
      type: String,
      maxlength: [100, 'Danh mục phụ không được vượt quá 100 ký tự'],
    },

    // Thông tin thực tập
    internship: {
      type: {
        type: String,
        enum: [
          'summer',
          'semester',
          'year-round',
          'project-based',
          'remote',
          'hybrid',
        ],
        required: [true, 'Loại thực tập là bắt buộc'],
      },
      duration: {
        type: Number,
        min: 1,
        max: 24,
        required: [true, 'Thời gian thực tập là bắt buộc'],
      }, // months
      startDate: {
        type: Date,
        required: [true, 'Ngày bắt đầu là bắt buộc'],
      },
      endDate: Date,
      isPaid: {
        type: Boolean,
        default: false,
      },
      stipend: {
        amount: {
          type: Number,
          min: 0,
        },
        currency: {
          type: String,
          default: 'VND',
        },
        period: {
          type: String,
          enum: ['month', 'week', 'hour', 'project'],
          default: 'month',
        },
        isNegotiable: {
          type: Boolean,
          default: false,
        },
      },
      academicCredit: {
        type: Boolean,
        default: false,
      },
      remoteOption: {
        type: Boolean,
        default: false,
      },
      flexibleHours: {
        type: Boolean,
        default: false,
      },
    },

    // Requirements
    requirements: {
      education: {
        level: {
          type: String,
          enum: [
            'High School',
            'Associate',
            'Bachelor',
            'Master',
            'PhD',
            'Any',
          ],
          default: 'Bachelor',
        },
        majors: [String],
        minGpa: {
          type: Number,
          min: 0,
          max: 4,
        },
        year: [
          {
            type: Number,
            min: 1,
            max: 6,
            validate: {
              validator: Number.isInteger,
              message: 'Năm học phải là số nguyên',
            },
          },
        ], // [2, 3, 4]
      },
      skills: [
        {
          skillId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill',
            required: true,
          },
          level: {
            type: String,
            enum: ['required', 'preferred', 'nice-to-have'],
            default: 'required',
          },
          importance: {
            type: Number,
            min: 1,
            max: 10,
            default: 5,
          },
        },
      ],
      experience: {
        minMonths: {
          type: Number,
          min: 0,
          default: 0,
        },
        projectBased: {
          type: Boolean,
          default: true,
        },
        experienceLevel: {
          type: String,
          enum: ['no-experience', 'beginner', 'intermediate', 'advanced'],
          default: 'beginner',
        },
      },
      languages: [
        {
          language: {
            type: String,
            required: true,
          },
          level: {
            type: String,
            enum: ['basic', 'intermediate', 'fluent', 'native'],
            default: 'intermediate',
          },
        },
      ],
      age: {
        min: {
          type: Number,
          min: 16,
          max: 100,
        },
        max: {
          type: Number,
          min: 16,
          max: 100,
        },
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'any'],
        default: 'any',
      },
    },

    // Job Description
    description: {
      type: String,
      required: [true, 'Mô tả công việc là bắt buộc'],
      maxlength: [5000, 'Mô tả không được vượt quá 5000 ký tự'],
    },
    responsibilities: [
      {
        type: String,
        maxlength: [500, 'Trách nhiệm không được vượt quá 500 ký tự'],
      },
    ],
    jobRequirements: [
      {
        type: String,
        maxlength: [500, 'Yêu cầu không được vượt quá 500 ký tự'],
      },
    ],
    benefits: [
      {
        type: String,
        maxlength: [200, 'Lợi ích không được vượt quá 200 ký tự'],
      },
    ],
    learningOutcomes: [
      {
        type: String,
        maxlength: [300, 'Kết quả học tập không được vượt quá 300 ký tự'],
      },
    ],

    // Location & Work Arrangement
    location: {
      type: {
        type: String,
        enum: ['onsite', 'remote', 'hybrid'],
        default: 'onsite',
      },
      city: {
        type: String,
        required: [true, 'Thành phố là bắt buộc'],
      },
      district: String,
      address: String,
      country: {
        type: String,
        default: 'VN',
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      remote: {
        type: Boolean,
        default: false,
      },
      hybrid: {
        type: Boolean,
        default: false,
      },
    },

    // Salary & Benefits
    salary: {
      type: {
        type: String,
        enum: ['negotiable', 'fixed', 'range'],
        default: 'negotiable',
      },
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'VND',
      },
      period: {
        type: String,
        enum: ['hour', 'day', 'week', 'month', 'project'],
        default: 'month',
      },
      isNegotiable: {
        type: Boolean,
        default: true,
      },
      benefits: [
        {
          type: String,
          enum: [
            'transportation',
            'meals',
            'accommodation',
            'health-insurance',
            'learning',
            'mentorship',
            'networking',
            'employment-opportunity',
          ],
        },
      ],
    },

    // AI Analysis
    aiAnalysis: {
      skillsExtracted: [String],
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
      },
      category: {
        type: String,
        enum: ['tech', 'business', 'marketing', 'design', 'data', 'other'],
        default: 'tech',
      },
      embedding: [
        {
          type: Number,
        },
      ], // Vector embedding
      lastAnalyzedAt: Date,
      matchingScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },

    // Application settings
    applicationSettings: {
      requireCoverLetter: {
        type: Boolean,
        default: false,
      },
      requireResume: {
        type: Boolean,
        default: true,
      },
      requirePortfolio: {
        type: Boolean,
        default: false,
      },
      requireReferences: {
        type: Boolean,
        default: false,
      },
      maxApplications: {
        type: Number,
        min: 1,
        default: 100,
      },
      deadline: Date,
      rollingBasis: {
        type: Boolean,
        default: true,
      },
      questions: [
        {
          question: {
            type: String,
            required: true,
            maxlength: [500, 'Câu hỏi không được vượt quá 500 ký tự'],
          },
          required: {
            type: Boolean,
            default: false,
          },
          type: {
            type: String,
            enum: ['text', 'textarea', 'multiple-choice', 'file'],
            default: 'text',
          },
          options: [String], // For multiple choice questions
        },
      ],
    },

    // Status & Visibility
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed', 'expired', 'filled'],
      default: 'draft',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    isHot: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    // Statistics
    stats: {
      views: {
        type: Number,
        default: 0,
      },
      applications: {
        type: Number,
        default: 0,
      },
      saves: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
    },

    // SEO & Marketing
    seo: {
      keywords: [String],
      metaDescription: {
        type: String,
        maxlength: [160, 'Meta description không được vượt quá 160 ký tự'],
      },
      canonicalUrl: String,
    },

    // Contact Information
    contact: {
      name: String,
      email: String,
      phone: String,
      linkedin: String,
    },

    // Posted By
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // System Fields
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    publishedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Search & Performance
JobSchema.index({
  title: 'text',
  description: 'text',
  'requirements.skills.skillId': 'text',
});
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ companyId: 1, status: 1 });
JobSchema.index({ 'location.city': 1, status: 1 });
JobSchema.index({ 'location.type': 1, status: 1 });
JobSchema.index({ category: 1, status: 1 });
JobSchema.index({ jobType: 1, status: 1 });
JobSchema.index({ 'internship.type': 1, status: 1 });
JobSchema.index({ 'requirements.skills.skillId': 1 });
JobSchema.index({ 'aiAnalysis.difficulty': 1, status: 1 });
JobSchema.index({ 'aiAnalysis.category': 1, status: 1 });
JobSchema.index({ isFeatured: 1, status: 1 });
JobSchema.index({ isUrgent: 1, status: 1 });
JobSchema.index({ isHot: 1, status: 1 });
JobSchema.index({ priority: -1, createdAt: -1 });
JobSchema.index({ 'salary.min': 1, 'salary.max': 1 });
JobSchema.index({ 'applicationSettings.deadline': 1 });
JobSchema.index({ publishedAt: -1 });
JobSchema.index({ expiresAt: 1 });

// Compound Indexes for Complex Queries
JobSchema.index({ status: 1, 'location.city': 1, category: 1 });
JobSchema.index({ status: 1, 'location.type': 1, jobType: 1 });
JobSchema.index({ status: 1, isFeatured: 1, createdAt: -1 });
JobSchema.index({
  status: 1,
  'aiAnalysis.difficulty': 1,
  'aiAnalysis.category': 1,
});
JobSchema.index({ 'location.city': 1, category: 1, status: 1 });
JobSchema.index({ 'requirements.skills.skillId': 1, status: 1, createdAt: -1 });

// Virtuals
JobSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

JobSchema.virtual('poster', {
  ref: 'User',
  localField: 'postedBy',
  foreignField: '_id',
  justOne: true,
});

JobSchema.virtual('skillDetails', {
  ref: 'Skill',
  localField: 'requirements.skills.skillId',
  foreignField: '_id',
});

JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId',
});

JobSchema.virtual('savedBy', {
  ref: 'SavedJob',
  localField: '_id',
  foreignField: 'jobId',
});

// Virtual for full location
JobSchema.virtual('fullLocation').get(function () {
  const parts = [];
  if (this.location.district) parts.push(this.location.district);
  if (this.location.city) parts.push(this.location.city);
  if (this.location.country && this.location.country !== 'VN')
    parts.push(this.location.country);
  return parts.join(', ');
});

// Virtual for salary range
JobSchema.virtual('salaryRange').get(function () {
  if (this.salary.type === 'negotiable') return 'Thương lượng';
  if (this.salary.type === 'fixed')
    return `${this.salary.min?.toLocaleString()} ${this.salary.currency}`;
  if (this.salary.type === 'range') {
    return `${this.salary.min?.toLocaleString()} - ${this.salary.max?.toLocaleString()} ${
      this.salary.currency
    }`;
  }
  return 'Thương lượng';
});

// Virtual for application deadline
JobSchema.virtual('deadlineText').get(function () {
  if (this.applicationSettings.rollingBasis) return 'Nhận hồ sơ liên tục';
  if (!this.applicationSettings.deadline) return 'Không có deadline';

  const now = new Date();
  const deadline = new Date(this.applicationSettings.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Đã hết hạn';
  if (diffDays === 0) return 'Hết hạn hôm nay';
  if (diffDays === 1) return 'Hết hạn ngày mai';
  if (diffDays <= 7) return `Còn ${diffDays} ngày`;
  return `Hết hạn: ${deadline.toLocaleDateString('vi-VN')}`;
});

// Methods
JobSchema.methods.getRequiredSkills = function () {
  return this.requirements.skills.filter(skill => skill.level === 'required');
};

JobSchema.methods.getPreferredSkills = function () {
  return this.requirements.skills.filter(skill => skill.level === 'preferred');
};

JobSchema.methods.updateStats = async function () {
  const applicationCount = await this.model('Application').countDocuments({
    jobId: this._id,
  });

  this.stats.applications = applicationCount;
  return this.save();
};

JobSchema.methods.isExpired = function () {
  if (this.applicationSettings.rollingBasis) return false;
  if (!this.applicationSettings.deadline) return false;
  return new Date() > this.applicationSettings.deadline;
};

JobSchema.methods.isFull = function () {
  return this.stats.applications >= this.applicationSettings.maxApplications;
};

JobSchema.methods.canApply = function () {
  return this.status === 'active' && !this.isExpired() && !this.isFull();
};

JobSchema.methods.generateSlug = function () {
  const title = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  const timestamp = Date.now().toString().slice(-6);
  return `${title}-${timestamp}`;
};

// Static Methods for Search & Filtering
JobSchema.statics.findActive = function () {
  return this.find({
    status: 'active',
    $or: [
      { 'applicationSettings.deadline': { $gt: new Date() } },
      { 'applicationSettings.rollingBasis': true },
    ],
  }).sort({ createdAt: -1 });
};

JobSchema.statics.findByLocation = function (city) {
  return this.find({
    status: 'active',
    'location.city': city,
  }).sort({ createdAt: -1 });
};

JobSchema.statics.findBySkills = function (skillIds) {
  return this.find({
    status: 'active',
    'requirements.skills.skillId': { $in: skillIds },
  }).sort({ createdAt: -1 });
};

JobSchema.statics.findByCategory = function (category) {
  return this.find({
    status: 'active',
    category: category,
  }).sort({ createdAt: -1 });
};

JobSchema.statics.findByJobType = function (jobType) {
  return this.find({
    status: 'active',
    jobType: jobType,
  }).sort({ createdAt: -1 });
};

JobSchema.statics.findFeatured = function () {
  return this.find({
    status: 'active',
    isFeatured: true,
  }).sort({ priority: -1, createdAt: -1 });
};

JobSchema.statics.findUrgent = function () {
  return this.find({
    status: 'active',
    isUrgent: true,
  }).sort({ createdAt: -1 });
};

JobSchema.statics.findHot = function () {
  return this.find({
    status: 'active',
    isHot: true,
  }).sort({ 'stats.views': -1, createdAt: -1 });
};

JobSchema.statics.searchJobs = function (query, filters = {}) {
  const searchQuery = {
    status: 'active',
    $or: [
      { 'applicationSettings.deadline': { $gt: new Date() } },
      { 'applicationSettings.rollingBasis': true },
    ],
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Apply filters
  if (filters.category) searchQuery.category = filters.category;
  if (filters.jobType) searchQuery.jobType = filters.jobType;
  if (filters.location) searchQuery['location.city'] = filters.location;
  if (filters.locationType) searchQuery['location.type'] = filters.locationType;
  if (filters.skills && filters.skills.length > 0) {
    searchQuery['requirements.skills.skillId'] = { $in: filters.skills };
  }
  if (filters.salaryMin)
    searchQuery['salary.min'] = { $gte: filters.salaryMin };
  if (filters.salaryMax)
    searchQuery['salary.max'] = { $lte: filters.salaryMax };
  if (filters.experienceLevel)
    searchQuery['requirements.experience.experienceLevel'] =
      filters.experienceLevel;
  if (filters.educationLevel)
    searchQuery['requirements.education.level'] = filters.educationLevel;
  if (filters.isRemote !== undefined)
    searchQuery['location.remote'] = filters.isRemote;
  if (filters.isUrgent) searchQuery.isUrgent = true;
  if (filters.isFeatured) searchQuery.isFeatured = true;

  return this.find(searchQuery).sort({ createdAt: -1 });
};

// Pre-save middleware
JobSchema.pre('save', function (next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.generateSlug();
  }

  // Auto-set endDate if not provided
  if (
    !this.internship.endDate &&
    this.internship.startDate &&
    this.internship.duration
  ) {
    const endDate = new Date(this.internship.startDate);
    endDate.setMonth(endDate.getMonth() + this.internship.duration);
    this.internship.endDate = endDate;
  }

  // Validate deadline is after startDate
  if (this.applicationSettings.deadline && this.internship.startDate) {
    if (this.applicationSettings.deadline < this.internship.startDate) {
      return next(new Error('Deadline phải sau ngày bắt đầu thực tập'));
    }
  }

  // Validate at least one skill is required
  if (this.requirements.skills.length === 0) {
    return next(new Error('Ít nhất một kỹ năng là bắt buộc'));
  }

  // Set publishedAt when status changes to active
  if (
    this.isModified('status') &&
    this.status === 'active' &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // Update updatedAt
  this.updatedAt = new Date();

  next();
});

module.exports = mongoose.model('Job', JobSchema);
