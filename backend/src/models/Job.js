const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema(
  {
    min: Number,
    max: Number,
    currency: { type: String, default: 'VND' },
    unit: { type: String, default: 'month' }, // month | year | hour
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    city: String,
    district: String,
    country: { type: String, default: 'VN' },
  },
  { _id: false }
);

const AiSchema = new mongoose.Schema(
  {
    isIntern: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
    matchedKeywords: [{ type: String }],
  },
  { _id: false }
);

const JobSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    externalId: { type: String },
    title: { type: String, required: true },
    company: { type: String },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    description: { type: String },
    requirements: String,
    responsibilities: String,
    benefits: [String],
    skills: [{ type: String }],
    tags: [{ type: String }],
    location: LocationSchema,
    salary: SalarySchema,
    type: { type: String, index: true }, // intern | fulltime | parttime | contract
    level: { type: String },
    experience: { type: String }, // Entry level, Mid level, etc.
    education: { type: String }, // Bachelor, Master, etc.
    url: { type: String },
    logoUrl: { type: String },
    postDate: { type: Date },
    expireDate: { type: Date },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    // Stats
    stats: {
      views: { type: Number, default: 0 },
      applications: { type: Number, default: 0 },
      saves: { type: Number, default: 0 }
    },
    // AI Analysis
    ai: AiSchema,
    // Employer info
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Application settings
    applicationSettings: {
      requireCoverLetter: { type: Boolean, default: false },
      requireResume: { type: Boolean, default: true },
      allowDirectApply: { type: Boolean, default: true },
      maxApplications: Number
    }
  },
  { timestamps: true }
);

JobSchema.index({ title: 'text', description: 'text', skills: 'text', tags: 'text' });
JobSchema.index({ type: 1, 'location.city': 1, 'salary.min': 1, postDate: -1 });
JobSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Job', JobSchema);



