const mongoose = require('mongoose');
const {
  JOB_TYPES,
  JOB_STATUS,
  WORK_TYPES,
} = require('../constants/job.constants');

const JobSchema = new mongoose.Schema(
  {
    // Thông tin người tạo (có thể mở rộng)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Có thể là employer hoặc HR staff
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile', // Company info
      required: true,
    },

    // Thông tin cơ bản
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
    },

    // Yêu cầu (có thể mở rộng cho AI analysis)
    requirements: {
      skills: [String], // ["JavaScript", "React", "Node.js"]
      education: String, // "Đại học CNTT"
      experience: String, // "0-1 năm kinh nghiệm"
      languages: [String], // ["English", "Vietnamese"]
      other: String, // Yêu cầu khác
    },

    // Thông tin job
    jobType: {
      type: String,
      enum: Object.values(JOB_TYPES),
      default: JOB_TYPES.INTERNSHIP,
    },

    // Lương
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'VND',
      },
      negotiable: { type: Boolean, default: false },
    },

    // Phúc lợi
    benefits: [String], // ["Laptop", "Free lunch", "Training"]

    // Địa điểm (có thể multiple locations sau)
    location: {
      city: String,
      district: String,
      address: String,
      workType: {
        type: String,
        enum: Object.values(WORK_TYPES),
        default: WORK_TYPES.ONSITE,
      },
    },

    // Thời gian
    timeline: {
      duration: String, // "3 tháng", "6 tháng"
      startDate: Date,
      deadline: Date,
    },
    positions: { type: Number, default: 1 },

    // Trạng thái
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.DRAFT,
    },

    // Stats cơ bản (có thể mở rộng cho analytics)
    analytics: {
      views: { type: Number, default: 0 },
      applications: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },

    // Classification cho AI analysis sau này
    classification: {
      industry: String, // "IT", "Marketing", "Finance"
      level: String, // "Entry", "Mid", "Senior"
      category: String, // "Frontend", "Backend", "Mobile"
      tags: [String], // Auto-generated hoặc manual
    },

    // Metadata cho future features
    metadata: {
      priority: { type: Number, default: 0 }, // Featured jobs
      source: { type: String, default: 'manual' }, // manual, imported, ai-generated
      lastAnalyzed: Date, // Cho AI analysis
      searchKeywords: [String], // SEO keywords
    },
  },
  {
    timestamps: true,
  }
);

// Indexes cho performance và future analytics
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ createdBy: 1, status: 1 });
JobSchema.index({ company: 1, status: 1 });
JobSchema.index({ 'location.city': 1 });
JobSchema.index({ 'requirements.skills': 1 });
JobSchema.index({ 'classification.industry': 1 });
JobSchema.index({ 'classification.category': 1 });
JobSchema.index({ 'timeline.deadline': 1 });
JobSchema.index({ createdAt: -1 });

// Virtuals
JobSchema.virtual('isExpired').get(function () {
  return this.timeline.deadline && new Date() > this.timeline.deadline;
});

JobSchema.virtual('daysRemaining').get(function () {
  if (!this.timeline.deadline) return null;
  const diff = this.timeline.deadline - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Methods đơn giản nhưng có thể mở rộng
JobSchema.methods.incrementViews = function () {
  this.analytics.views += 1;
  return this.save();
};

JobSchema.methods.incrementApplications = function () {
  this.analytics.applications += 1;
  return this.save();
};

// Method cho future AI analysis
JobSchema.methods.updateClassification = function (aiResults) {
  if (aiResults) {
    this.classification = { ...this.classification, ...aiResults };
    this.metadata.lastAnalyzed = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Job', JobSchema);
