const mongoose = require('mongoose');

const IndustrySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    parentCode: { type: String, default: null, index: true }, // hierarchy for sub-industries

    // Multilingual names
    name: {
      vi: { type: String, required: true, trim: true, index: true },
      en: { type: String, required: true, trim: true, index: true },
    },

    description: {
      vi: { type: String, default: '' },
      en: { type: String, default: '' },
    },

    // Path from root for efficient querying
    path: [{ type: String }],

    // Appearance defaults for CV templates or UI
    color: { type: String, default: '#2563eb' },
    icon: { type: String, default: '' },

    // Keywords to improve search/classification
    keywords: [{ type: String }],

    // Suggested template ids from cvTemplates
    suggestedTemplates: [{ type: String }],

    // Content suggestions per section
    suggestions: {
      summary: [{ type: String }],
      experience: [{ type: String }],
      projects: [{ type: String }],
      skills: [{ type: String }],
    },

    // Visibility and ordering
    visible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },

    // Analytics counters (denormalized)
    stats: {
      totalJobs: { type: Number, default: 0 },
      totalCandidates: { type: Number, default: 0 },
      totalCVs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

IndustrySchema.index({
  'name.vi': 'text',
  'name.en': 'text',
  keywords: 'text',
});
IndustrySchema.index({ visible: 1, sortOrder: 1 });
IndustrySchema.index({ path: 1 });

// Middleware to build the path before saving
IndustrySchema.pre('save', async function (next) {
  if (this.isModified('parentCode') || this.isNew) {
    if (this.parentCode) {
      const parent = await this.constructor.findOne({ code: this.parentCode });
      if (parent) {
        this.path = [...parent.path, this.code];
      } else {
        this.path = [this.code]; // Parent not found, treat as root
      }
    } else {
      this.path = [this.code];
    }
  }
  next();
});

module.exports = mongoose.model('Industry', IndustrySchema);
