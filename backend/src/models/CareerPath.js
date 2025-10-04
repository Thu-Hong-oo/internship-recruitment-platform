const mongoose = require('mongoose');

const CareerPathSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: String,
    description: String,

    targetRoles: [String],
    industries: [String],

    levels: [
      {
        name: String, // 'Intern', 'Junior', 'Mid', 'Senior'
        order: Number,

        requiredSkills: [
          {
            skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
            level: String,
            importance: Number,
          },
        ],

        estimatedDuration: {
          min: Number,
          max: Number,
          unit: String,
        },

        milestones: [
          {
            title: String,
            description: String,
            criteria: [String],
          },
        ],
      },
    ],

    learningResources: [
      {
        type: String,
        title: String,
        url: String,
        provider: String,
        duration: Number,
        difficulty: String,
        relevantLevel: String,
      },
    ],

    successStories: [
      {
        candidateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CandidateProfile',
        },
        currentLevel: String,
        timeSpent: Number,
        testimonial: String,
      },
    ],

    popularity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
CareerPathSchema.index({ slug: 1 }, { unique: true });
CareerPathSchema.index({ targetRoles: 1 });
CareerPathSchema.index({ industries: 1 });
CareerPathSchema.index({ popularity: -1 });

// Pre-save middleware để tạo slug
CareerPathSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual fields
CareerPathSchema.virtual('totalLevels').get(function () {
  return this.levels.length;
});

CareerPathSchema.virtual('totalDuration').get(function () {
  return this.levels.reduce((total, level) => {
    return total + (level.estimatedDuration?.max || 0);
  }, 0);
});

module.exports = mongoose.model('CareerPath', CareerPathSchema);
