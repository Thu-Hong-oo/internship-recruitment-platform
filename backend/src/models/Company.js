const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Tên công ty là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tên công ty không được vượt quá 200 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Mô tả không được vượt quá 2000 ký tự'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Mô tả ngắn không được vượt quá 300 ký tự'],
    },

    // Industry & Category
    industry: {
      primary: {
        type: String,
        required: [true, 'Ngành nghề chính là bắt buộc'],
        enum: [
          'tech',
          'business',
          'marketing',
          'design',
          'data',
          'finance',
          'hr',
          'sales',
          'education',
          'healthcare',
          'manufacturing',
          'retail',
          'consulting',
          'other',
        ],
      },
      secondary: [
        {
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
            'education',
            'healthcare',
            'manufacturing',
            'retail',
            'consulting',
            'telecommunications',
            'transportation',
            'logistics',
            'ecommerce',
            'entertainment',
            'other',
          ],
        },
      ],
      tags: [String],
    },

    // Company Size & Type
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      required: [true, 'Quy mô công ty là bắt buộc'],
    },
    employeeCount: {
      min: {
        type: Number,
        min: 1,
      },
      max: {
        type: Number,
        min: 1,
      },
    },
    companyType: {
      type: String,
      enum: [
        'private',
        'public',
        'government',
        'non-profit',
        'startup',
        'multinational',
      ],
      default: 'private',
    },

    // Founding & History
    foundedYear: {
      type: Number,
      min: [1900, 'Năm thành lập phải từ 1900'],
      max: [
        new Date().getFullYear(),
        'Năm thành lập không thể trong tương lai',
      ],
    },
    foundedMonth: {
      type: Number,
      min: 1,
      max: 12,
    },

    // Digital Presence
    website: {
      type: String,
      match: [
        /^https?:\/\/.+/,
        'Website phải bắt đầu bằng http:// hoặc https://',
      ],
    },
    logo: {
      url: String,
      filename: String,
      uploadedAt: Date,
    },
    banner: {
      url: String,
      filename: String,
      uploadedAt: Date,
    },
    socialMedia: {
      linkedin: {
        type: String,
        match: [
          /^https:\/\/linkedin\.com\/company\/.+/,
          'LinkedIn URL không hợp lệ',
        ],
      },
      facebook: {
        type: String,
        match: [/^https:\/\/facebook\.com\/.+/, 'Facebook URL không hợp lệ'],
      },
      twitter: {
        type: String,
        match: [/^https:\/\/twitter\.com\/.+/, 'Twitter URL không hợp lệ'],
      },
      instagram: {
        type: String,
        match: [/^https:\/\/instagram\.com\/.+/, 'Instagram URL không hợp lệ'],
      },
      youtube: {
        type: String,
        match: [/^https:\/\/youtube\.com\/.+/, 'YouTube URL không hợp lệ'],
      },
    },

    // Location
    location: {
      type: {
        type: String,
        enum: ['onsite', 'remote', 'hybrid', 'multiple'],
        default: 'onsite',
      },
      headquarters: {
        address: String,
        city: {
          type: String,
          required: [true, 'Thành phố trụ sở chính là bắt buộc'],
        },
        district: String,
        country: {
          type: String,
          default: 'VN',
        },
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
      offices: [
        {
          name: String,
          address: String,
          city: String,
          district: String,
          country: {
            type: String,
            default: 'VN',
          },
          coordinates: {
            latitude: Number,
            longitude: Number,
          },
          isMain: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },

    // Contact Information
    contact: {
      email: {
        type: String,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Email không hợp lệ',
        ],
      },
      phone: {
        type: String,
        match: [/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ'],
      },
      fax: String,
      contactPerson: {
        name: String,
        position: String,
        email: String,
        phone: String,
      },
    },

    // Company Culture & Benefits
    culture: {
      values: [String],
      mission: {
        type: String,
        maxlength: [500, 'Sứ mệnh không được vượt quá 500 ký tự'],
      },
      vision: {
        type: String,
        maxlength: [500, 'Tầm nhìn không được vượt quá 500 ký tự'],
      },
      workStyle: [
        {
          type: String,
          enum: [
            'collaborative',
            'independent',
            'agile',
            'traditional',
            'flexible',
            'remote-first',
          ],
        },
      ],
      dressCode: {
        type: String,
        enum: ['casual', 'business-casual', 'formal', 'uniform', 'flexible'],
      },
    },

    benefits: [
      {
        name: {
          type: String,
          required: true,
          maxlength: [100, 'Tên lợi ích không được vượt quá 100 ký tự'],
        },
        description: {
          type: String,
          maxlength: [300, 'Mô tả lợi ích không được vượt quá 300 ký tự'],
        },
        category: {
          type: String,
          enum: [
            'health',
            'financial',
            'work-life',
            'learning',
            'career',
            'social',
            'other',
          ],
        },
        icon: String,
        isHighlighted: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Internship Program
    internshipProgram: {
      hasProgram: {
        type: Boolean,
        default: false,
      },
      programName: String,
      description: {
        type: String,
        maxlength: [1000, 'Mô tả chương trình không được vượt quá 1000 ký tự'],
      },
      duration: {
        min: Number,
        max: Number,
        unit: {
          type: String,
          enum: ['weeks', 'months'],
          default: 'months',
        },
      },
      stipend: {
        hasStipend: {
          type: Boolean,
          default: false,
        },
        amount: {
          min: Number,
          max: Number,
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
      },
      benefits: [String],
      mentorship: {
        type: Boolean,
        default: false,
      },
      networking: {
        type: Boolean,
        default: false,
      },
      employmentOpportunity: {
        type: Boolean,
        default: false,
      },
      academicCredit: {
        type: Boolean,
        default: false,
      },
    },

    // Verification & Status
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
      verificationMethod: {
        type: String,
        enum: ['manual', 'document', 'phone', 'email', 'social'],
      },
      documents: [
        {
          type: {
            type: String,
            enum: [
              'business-license',
              'tax-certificate',
              'company-registration',
              'other',
            ],
          },
          url: String,
          filename: String,
          uploadedAt: Date,
          verified: {
            type: Boolean,
            default: false,
          },
          verifiedAt: Date,
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        },
      ],
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'active',
    },

    // Ratings & Reviews
    rating: {
      overall: {
        type: Number,
        min: [0, 'Rating không thể âm'],
        max: [5, 'Rating không thể vượt quá 5'],
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
        min: [0, 'Số lượng đánh giá không thể âm'],
      },
      categories: {
        workLifeBalance: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        careerGrowth: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        compensation: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        management: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        culture: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
      },
    },

    // Statistics
    stats: {
      totalJobs: {
        type: Number,
        default: 0,
        min: [0, 'Tổng số job không thể âm'],
      },
      activeJobs: {
        type: Number,
        default: 0,
        min: [0, 'Số job đang hoạt động không thể âm'],
      },
      totalApplications: {
        type: Number,
        default: 0,
        min: [0, 'Tổng số đơn ứng tuyển không thể âm'],
      },
      totalInterns: {
        type: Number,
        default: 0,
        min: [0, 'Tổng số thực tập sinh không thể âm'],
      },
      totalEmployees: {
        type: Number,
        default: 0,
        min: [0, 'Tổng số nhân viên không thể âm'],
      },
      views: {
        type: Number,
        default: 0,
        min: [0, 'Số lượt xem không thể âm'],
      },
      saves: {
        type: Number,
        default: 0,
        min: [0, 'Số lượt lưu không thể âm'],
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

    // Owner (người sở hữu công ty - employer)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Created By (admin tạo hoặc owner tự tạo)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Search & Performance
CompanySchema.index({
  name: 'text',
  description: 'text',
  'industry.primary': 'text',
});
CompanySchema.index({ 'industry.primary': 1 });
CompanySchema.index({ size: 1 });
CompanySchema.index({ 'location.headquarters.city': 1 });
CompanySchema.index({ 'verification.isVerified': 1 });
CompanySchema.index({ status: 1 });
CompanySchema.index({ owner: 1 });
CompanySchema.index({ 'rating.overall': -1 });
CompanySchema.index({ 'stats.totalJobs': -1 });
CompanySchema.index({ createdAt: -1 });

// Compound Indexes
CompanySchema.index({ 'verification.isVerified': 1, status: 1 });
CompanySchema.index({ 'industry.primary': 1, 'location.headquarters.city': 1 });
CompanySchema.index({ 'rating.overall': -1, 'stats.totalJobs': -1 });
CompanySchema.index({ size: 1, 'industry.primary': 1 });

// Virtuals
CompanySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'companyId',
});

CompanySchema.virtual('activeJobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'companyId',
  match: { status: 'active' },
});

CompanySchema.virtual('employers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'employerProfile.company._id',
});

CompanySchema.virtual('ownerInfo', {
  ref: 'User',
  localField: 'owner',
  foreignField: '_id',
  justOne: true,
});

// Virtual for full address
CompanySchema.virtual('fullAddress').get(function () {
  const hq = this.location.headquarters;
  const parts = [];
  if (hq.address) parts.push(hq.address);
  if (hq.district) parts.push(hq.district);
  if (hq.city) parts.push(hq.city);
  if (hq.country && hq.country !== 'VN') parts.push(hq.country);
  return parts.join(', ');
});

// Virtual for company age
CompanySchema.virtual('age').get(function () {
  if (!this.foundedYear) return null;
  return new Date().getFullYear() - this.foundedYear;
});

// Virtual for employee range
CompanySchema.virtual('employeeRange').get(function () {
  if (!this.employeeCount) return this.size;

  const min = this.employeeCount.min;
  const max = this.employeeCount.max;

  if (min && max) {
    if (min === max) return `${min} nhân viên`;
    return `${min}-${max} nhân viên`;
  }

  if (min) return `Từ ${min} nhân viên`;
  if (max) return `Đến ${max} nhân viên`;

  return this.size;
});

// Methods
CompanySchema.methods.generateSlug = function () {
  const name = this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  const timestamp = Date.now().toString().slice(-6);
  return `${name}-${timestamp}`;
};

CompanySchema.methods.updateStats = async function () {
  const Job = this.model('Job');
  const Application = this.model('Application');

  const [totalJobs, activeJobs, totalApplications] = await Promise.all([
    Job.countDocuments({ companyId: this._id }),
    Job.countDocuments({ companyId: this._id, status: 'active' }),
    Application.countDocuments({ 'job.companyId': this._id }),
  ]);

  this.stats.totalJobs = totalJobs;
  this.stats.activeJobs = activeJobs;
  this.stats.totalApplications = totalApplications;

  return this.save();
};

CompanySchema.methods.calculateRating = async function () {
  const Review = this.model('Review');

  const result = await Review.aggregate([
    { $match: { companyId: this._id } },
    {
      $group: {
        _id: null,
        overall: { $avg: '$rating.overall' },
        workLifeBalance: { $avg: '$rating.workLifeBalance' },
        careerGrowth: { $avg: '$rating.careerGrowth' },
        compensation: { $avg: '$rating.compensation' },
        management: { $avg: '$rating.management' },
        culture: { $avg: '$rating.culture' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    const data = result[0];
    this.rating.overall = Math.round(data.overall * 10) / 10;
    this.rating.count = data.count;
    this.rating.categories.workLifeBalance =
      Math.round(data.workLifeBalance * 10) / 10;
    this.rating.categories.careerGrowth =
      Math.round(data.careerGrowth * 10) / 10;
    this.rating.categories.compensation =
      Math.round(data.compensation * 10) / 10;
    this.rating.categories.management = Math.round(data.management * 10) / 10;
    this.rating.categories.culture = Math.round(data.culture * 10) / 10;
  }

  return this.save();
};

// Check if user is owner
CompanySchema.methods.isOwner = function (userId) {
  return this.owner.toString() === userId.toString();
};

// Check if user can manage company
CompanySchema.methods.canManage = function (user) {
  return this.isOwner(user.id) || user.role === 'admin';
};

// Static methods
CompanySchema.statics.findByIndustry = function (industry) {
  return this.find({
    'industry.primary': industry,
    status: 'active',
    'verification.isVerified': true,
  }).sort({ 'rating.overall': -1, 'stats.totalJobs': -1 });
};

CompanySchema.statics.findByLocation = function (city) {
  return this.find({
    'location.headquarters.city': city,
    status: 'active',
    'verification.isVerified': true,
  }).sort({ 'rating.overall': -1, 'stats.totalJobs': -1 });
};

CompanySchema.statics.findTopRated = function (limit = 10) {
  return this.find({
    status: 'active',
    'verification.isVerified': true,
    'rating.count': { $gte: 5 },
  })
    .sort({ 'rating.overall': -1, 'rating.count': -1 })
    .limit(limit);
};

CompanySchema.statics.searchCompanies = function (query, filters = {}) {
  const searchQuery = {
    status: 'active',
    'verification.isVerified': true,
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Apply filters
  if (filters.industry) searchQuery['industry.primary'] = filters.industry;
  if (filters.size) searchQuery.size = filters.size;
  if (filters.location)
    searchQuery['location.headquarters.city'] = filters.location;
  if (filters.hasInternshipProgram)
    searchQuery['internshipProgram.hasProgram'] = true;
  if (filters.minRating)
    searchQuery['rating.overall'] = { $gte: filters.minRating };

  return this.find(searchQuery).sort({
    'rating.overall': -1,
    'stats.totalJobs': -1,
  });
};

// Find company by owner
CompanySchema.statics.findByOwner = function (ownerId) {
  return this.findOne({ owner: ownerId });
};

// Find companies by owner with pagination
CompanySchema.statics.findByOwnerPaginated = function (ownerId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const query = { owner: ownerId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
};

// Pre-save middleware
CompanySchema.pre('save', function (next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.generateSlug();
  }

  // Set owner to createdBy if not provided
  if (!this.owner && this.createdBy) {
    this.owner = this.createdBy;
  }

  // Validate employee count
  if (this.employeeCount.min && this.employeeCount.max) {
    if (this.employeeCount.min > this.employeeCount.max) {
      return next(new Error('Số nhân viên tối thiểu không thể lớn hơn tối đa'));
    }
  }

  // Validate founded year
  if (this.foundedYear) {
    const currentYear = new Date().getFullYear();
    if (this.foundedYear > currentYear) {
      return next(new Error('Năm thành lập không thể trong tương lai'));
    }
  }

  next();
});

module.exports = mongoose.model('Company', CompanySchema);
