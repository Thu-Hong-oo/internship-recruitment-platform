const mongoose = require('mongoose');
const { JOB_STATUS } = require('../constants/common.constants');

const JobSchema = new mongoose.Schema({
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployerProfile',
    required: true,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, unique: true, index: true },
  description: { type: String, required: true, maxlength: 5000 },
  requirements: { type: String },
  benefits: { type: String },
  skills: [{ type: String, trim: true }],
  skillIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
  tags: [{ type: String, trim: true }],
  // DEPRECATED: use industryCode/subIndustryCode instead
  category: { type: String },
  industry: { type: String },

  // New normalized industry fields
  industryCode: { type: String, index: true }, // maps to Industry.code (root or leaf)
  subIndustryCode: { type: String, index: true }, // optional child industry
  industryPath: [{ type: String }], // e.g., ["technology", "software-dev"] for easy filtering
  level: {
    type: String,
    enum: ['Intern', 'Fresher', 'Junior', 'Senior', 'Manager', 'Director'],
  },
  jobType: {
    type: String,
    enum: ['Fulltime', 'Parttime', 'Intern', 'Freelance', 'Remote', 'Hybrid'],
  },
  workingMode: { type: String, enum: ['Onsite', 'Remote', 'Hybrid'] },
  // Structured address object (preferred)
  address: {
    street: { type: String, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, default: 'Vietnam', trim: true },
    fullAddress: { type: String, trim: true }, // Auto-generated from above fields
  },
  // DEPRECATED: Use address object instead. Kept for backward compatibility
  location: { type: String },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  currency: { type: String, default: 'VND' },
  experience: { type: String },
  education: { type: String },
  deadline: { type: Date },
  positions: { type: Number },
  status: {
    type: String,
    enum: Object.values(JOB_STATUS),
    default: JOB_STATUS.DRAFT,
  },
  views: { type: Number, default: 0 },
  stats: {
    applications: { type: Number, default: 0 },
    interviews: { type: Number, default: 0 },
    offers: { type: Number, default: 0 },
  },
  industryTrends: { type: String }, // AI phân tích ngành
  hotScore: { type: Number }, // AI đánh giá độ hot
  aiTags: [{ type: String }], // Tag AI gợi ý
  ai: {
    keywords: [String],
    embedding: [Number],

    // THÊM: Extracted skills với importance và confidence
    extractedSkills: [
      {
        name: String,
        importance: {
          type: String,
          enum: ['required', 'preferred', 'nice-to-have'],
        },
        level: String,
        confidence: Number,
      },
    ],

    // THÊM: Job category classification
    jobCategory: {
      primary: String,
      secondary: [String],
      confidence: Number,
    },

    // THÊM: Matching pool cho hiệu suất
    matchingPool: [
      {
        candidateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CandidateProfile',
        },
        matchScore: Number,
        matchReasons: [String],
        updatedAt: Date,
      },
    ],

    suggestedCandidates: [
      {
        candidateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CandidateProfile',
        },
        score: Number,
        matchingSkills: [String],
        // THÊM: Chi tiết matching
        strengthsMatch: [String],
        weaknessesMatch: [String],
        recommendations: [String],
      },
    ],

    analyzedAt: Date,
    needsReanalysis: { type: Boolean, default: false },
  },

}, {
  timestamps: true,
  // Soft delete fields 
  deletedAt: { type: Date, default: null },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
});

// Indexes
JobSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  skills: 'text',
  industry: 'text',
  category: 'text',
});

// THÊM: Indexes cần thiết cho performance
JobSchema.index({ 'ai.embedding': 1 }); // Cho vector search
JobSchema.index({ skills: 1, location: 1, status: 1 });
JobSchema.index({ skillIds: 1, status: 1 });
JobSchema.index({ industryCode: 1, subIndustryCode: 1, status: 1 });
JobSchema.index({ industryPath: 1 });
JobSchema.index({ 'ai.suggestedCandidates.score': -1 });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ employer: 1, status: 1 });
JobSchema.index({ deadline: 1 });
JobSchema.index({ deletedAt: 1 }); // For soft delete queries
JobSchema.index({ jobType: 1, status: 1, deadline: 1 });
JobSchema.index({ level: 1, status: 1 });
JobSchema.index({ salaryMin: 1, salaryMax: 1 });
JobSchema.index({ 'address.city': 1, status: 1 });
JobSchema.index({ 'address.district': 1, status: 1 });

// THÊM: Virtual fields hữu ích
JobSchema.virtual('isExpired').get(function () {
  return this.deadline && this.deadline < new Date();
});

JobSchema.virtual('daysUntilDeadline').get(function () {
  if (!this.deadline) return null;
  return Math.ceil((this.deadline - new Date()) / (1000 * 60 * 60 * 24));
});

JobSchema.virtual('isUrgent').get(function () {
  const days = this.daysUntilDeadline;
  return days !== null && days <= 7 && days > 0;
});

JobSchema.virtual('applicationRate').get(function () {
  if (!this.stats || this.stats.views === 0) return 0;
  return Math.round((this.stats.applications / this.stats.views) * 100);
});

JobSchema.virtual('isHot').get(function () {
  return this.hotScore && this.hotScore > 80;
});

// Static methods
JobSchema.statics.findActive = function () {
  return this.find({
    status: JOB_STATUS.ACTIVE,
    $or: [{ deadline: { $gte: new Date() } }, { deadline: null }],
  });
};

module.exports = mongoose.model('Job', JobSchema);
