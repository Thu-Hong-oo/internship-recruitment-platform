const mongoose = require('mongoose');

// SIMPLIFIED Skill Schema
const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên kỹ năng là bắt buộc'],
      unique: true,
      trim: true,
      maxlength: [100, 'Tên kỹ năng không được vượt quá 100 ký tự'],
    },
    category: {
      type: String, // slug format
      required: [true, 'Danh mục kỹ năng là bắt buộc'],
    },
    aliases: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      maxlength: [500, 'Mô tả không được vượt quá 500 ký tự'],
    },

    // AI embeddings
    embedding: [Number],

    // Metadata đơn giản
    popularity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // Demand info
    demandLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    trend: {
      type: String,
      enum: ['declining', 'stable', 'growing', 'emerging'],
      default: 'stable',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SkillSchema.index({ category: 1 });
SkillSchema.index({ popularity: -1 });
SkillSchema.index({ isActive: 1 });
SkillSchema.index({ name: 'text', description: 'text' });
SkillSchema.index({ demandLevel: 1 });
SkillSchema.index({ trend: 1 });
SkillSchema.index({ embedding: 1 }); // For vector search

// Virtual fields
SkillSchema.virtual('userCount', {
  ref: 'CandidateProfile',
  localField: '_id',
  foreignField: 'skills.technical.skillId',
  count: true,
});

SkillSchema.virtual('jobCount', {
  ref: 'Job',
  localField: 'name',
  foreignField: 'skills',
  count: true,
});

// Methods
SkillSchema.methods.updatePopularity = async function () {
  // Logic to update popularity based on job postings and user profiles
  const jobCount = await this.model('Job').countDocuments({
    skills: this.name,
    status: { $in: ['active', 'open'] },
  });

  this.popularity = jobCount;
  return this.save();
};

module.exports = mongoose.model('Skill', SkillSchema);
