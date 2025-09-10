const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    // === THÔNG TIN CƠ BẢN (BỮT BUỘC) ===
    title: {
      type: String,
      required: [true, 'Tiêu đề công việc là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự'],
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Công ty là bắt buộc'],
    },

    description: {
      type: String,
      required: [true, 'Mô tả công việc là bắt buộc'],
      maxlength: [3000, 'Mô tả không được vượt quá 3000 ký tự'],
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
        'real-estate',
        'education',
        'healthcare',
        'manufacturing',
        'retail',
        'other',
      ],
      required: [true, 'Danh mục là bắt buộc'],
    },

    // Ngành nghề phụ (tối đa 2)
    subCategories: [
      {
        type: String,
        maxlength: [50, 'Ngành nghề phụ không được vượt quá 50 ký tự'],
      },
    ],

    // Số lượng tuyển
    hiringCount: {
      type: Number,
      min: 1,
      default: 1,
    },

    location: {
      city: {
        type: String,
        required: [true, 'Thành phố là bắt buộc'],
      },
      district: String, // Quận/Huyện
      address: String, // Địa chỉ cụ thể
      type: {
        type: String,
        enum: ['onsite', 'remote', 'hybrid'],
        default: 'onsite',
      },
    },

    // Nhiều địa điểm làm việc
    multipleLocations: [
      {
        city: String,
        district: String,
        address: String,
        type: {
          type: String,
          enum: ['onsite', 'remote', 'hybrid'],
          default: 'onsite',
        },
      },
    ],

    // === THÔNG TIN THỰC TẬP (CÓ MẶC ĐỊNH HỢP LÝ) ===
    internship: {
      duration: {
        type: Number,
        min: 1,
        max: 12,
        default: 3, // Mặc định 3 tháng
      },

      startDate: {
        type: Date,
        default: () => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1); // Bắt đầu tháng sau
          return date;
        },
      },

      type: {
        type: String,
        enum: ['summer', 'semester', 'full-time', 'part-time'],
        default: 'semester',
      },

      // Compensation đơn giản hóa
      isPaid: {
        type: Boolean,
        default: false,
      },

      salary: {
        amount: {
          type: Number,
          min: 0,
        },
        period: {
          type: String,
          enum: ['month', 'week', 'project'],
          default: 'month',
        },
      },
    },

    // === YÊU CẦU CƠ BẢN (ĐƠN GIẢN HÓA) ===
    requirements: {
      // Học vấn
      yearOfStudy: {
        type: [String],
        enum: [
          '1st-year',
          '2nd-year',
          '3rd-year',
          '4th-year',
          'graduate',
          'any',
        ],
        default: ['any'],
      },

      majors: [String], // ["Công nghệ thông tin", "Khoa học máy tính"]

      // Kỹ năng - đơn giản hóa
      skills: [String], // ["JavaScript", "React", "Communication"]

      // Kinh nghiệm
      experienceRequired: {
        type: Boolean,
        default: false,
      },

      // Yêu cầu giới tính
      genderRequirement: {
        type: String,
        enum: ['male', 'female', 'any'],
        default: 'any',
      },

      // Cấp bậc
      level: {
        type: String,
        enum: [
          'intern',
          'junior',
          'mid-level',
          'senior',
          'lead',
          'manager',
          'any',
        ],
        default: 'intern',
      },

      minGPA: {
        type: Number,
        min: 0,
        max: 4,
      },

      // Ngôn ngữ
      languages: [
        {
          name: String,
          level: {
            type: String,
            enum: ['basic', 'intermediate', 'advanced'],
            default: 'intermediate',
          },
        },
      ],
    },

    // === THÔNG TIN BỔ SUNG (TÙY CHỌN) ===
    responsibilities: [String], // Mảng trách nhiệm

    learningOpportunities: [String], // Sẽ học được gì

    // Quyền lợi ứng viên (rich text)
    benefits: {
      type: String, // Rich text content
      maxlength: 5000,
    },

    // Lý do nên ứng tuyển (tối đa 3 lý do)
    reasonsToApply: [
      {
        type: String,
        maxlength: 3,
      },
    ],

    workEnvironment: {
      type: String,
      enum: ['startup', 'corporate', 'agency', 'remote-first'],
    },

    // === CÀI ĐẶT ỨNG TUYỂN ===
    application: {
      deadline: Date,

      maxApplications: {
        type: Number,
        default: 50,
      },

      requireCoverLetter: {
        type: Boolean,
        default: false,
      },

      requirePortfolio: {
        type: Boolean,
        default: false,
      },

      // Thông tin người nhận CV
      contactInfo: {
        fullName: String,
        phone: String,
        email: String,
      },
    },

    // === QUẢN LÝ ===
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'filled'],
      default: 'draft',
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // === THỐNG KÊ ===
    stats: {
      views: { type: Number, default: 0 },
      applications: { type: Number, default: 0 },
    },

    // === TAGS & METADATA ===
    tags: [String], // ["urgent", "remote-ok", "flexible-hours"]

    slug: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// === INDEXES ===
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ category: 1, 'location.city': 1 });
JobSchema.index({ 'internship.isPaid': 1, status: 1 });
JobSchema.index({ tags: 1 });

// === VIRTUALS ===
JobSchema.virtual('isExpired').get(function () {
  return this.application.deadline && new Date() > this.application.deadline;
});

JobSchema.virtual('daysLeft').get(function () {
  if (!this.application.deadline) return null;
  const diff = this.application.deadline - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// === METHODS ===
JobSchema.methods.generateSlug = function () {
  const slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return `${slug}-${Date.now().toString().slice(-6)}`;
};

// Pre-save middleware
JobSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.generateSlug();
  }
  next();
});

// === STATIC METHODS ===
JobSchema.statics.findActive = function () {
  return this.find({
    status: 'active',
    $or: [
      { 'application.deadline': { $gt: new Date() } },
      { 'application.deadline': null },
    ],
  });
};

JobSchema.statics.searchJobs = function (query, filters = {}) {
  const searchQuery = { status: 'active' };

  if (query) searchQuery.$text = { $search: query };
  if (filters.category) searchQuery.category = filters.category;
  if (filters.city) searchQuery['location.city'] = filters.city;
  if (filters.isPaid !== undefined)
    searchQuery['internship.isPaid'] = filters.isPaid;
  if (filters.remote)
    searchQuery['location.type'] = { $in: ['remote', 'hybrid'] };

  return this.find(searchQuery).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Job', JobSchema);
