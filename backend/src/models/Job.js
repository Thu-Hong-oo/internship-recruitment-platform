const mongoose = require('mongoose');
const { JOB_STATUS } = require('../constants/common.constants');

const JobSchema = new mongoose.Schema(
  {
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
    tags: [{ type: String, trim: true }],
    category: { type: String },
    industry: { type: String },
    level: {
      type: String,
      enum: ['Intern', 'Fresher', 'Junior', 'Senior', 'Manager', 'Director'],
    },
    jobType: {
      type: String,
      enum: ['Fulltime', 'Parttime', 'Intern', 'Freelance', 'Remote', 'Hybrid'],
    },
    workingMode: { type: String, enum: ['Onsite', 'Remote', 'Hybrid'] },
    address: { type: String },
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
      suggestedCandidates: [
        {
          candidateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CandidateProfile',
          },
          score: Number,
          matchingSkills: [String],
        },
      ],
      analyzedAt: Date,
    },
  },
  { timestamps: true }
);

// Indexes
JobSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  skills: 'text',
  industry: 'text',
  category: 'text',
});

module.exports = mongoose.model('Job', JobSchema);
