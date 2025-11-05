const mongoose = require('mongoose');

// HIERARCHICAL Skill Schema
const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên kỹ năng là bắt buộc'],
      unique: true,
      trim: true,
      maxlength: [100, 'Tên kỹ năng không được vượt quá 100 ký tự'],
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Mô tả không được vượt quá 500 ký tự'],
    },

    // HIERARCHICAL STRUCTURE
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      default: null, // null = root level skill
    },

    // AI embeddings
    embedding: [Number],

    // Metadata
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

    // Level in hierarchy (0 = root, 1 = level 1, etc.)
    level: {
      type: Number,
      default: 0,
    },

    // Path from root (e.g., ["programming", "web-development", "frontend"])
    path: [String],
  },
  {
    timestamps: true,
    // No system fields
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
  ref: 'Candidate',
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
