const mongoose = require('mongoose');

const ResumeBuilderSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },

    templateId: String,

    content: {
      personalInfo: Object,
      summary: String,
      experience: [Object],
      education: [Object],
      skills: [Object],
      projects: [Object],
      certifications: [Object],
    },

    customization: {
      targetJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      targetRole: String,
      tailoredFor: String,
      keywords: [String],
    },

    aiGenerated: {
      summary: Boolean,
      experienceBullets: [Number], // indexes of AI-generated bullets
      suggestions: [String],
    },

    versions: [
      {
        content: Object,
        createdAt: Date,
        note: String,
      },
    ],

    exports: [
      {
        format: String, // 'pdf', 'docx', 'html'
        url: String,
        generatedAt: Date,
      },
    ],

    isDefault: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'completed', 'archived'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Indexes
ResumeBuilderSchema.index({ candidateId: 1, isDefault: 1 });
ResumeBuilderSchema.index({ candidateId: 1, status: 1, updatedAt: -1 });
ResumeBuilderSchema.index({ 'customization.targetJobId': 1 });

// Pre-save middleware
ResumeBuilderSchema.pre('save', function (next) {
  // Ensure only one default resume per candidate
  if (this.isDefault && this.isModified('isDefault')) {
    this.constructor
      .updateMany(
        {
          candidateId: this.candidateId,
          _id: { $ne: this._id },
        },
        { isDefault: false }
      )
      .exec();
  }
  next();
});

// Methods
ResumeBuilderSchema.methods.createVersion = function (note) {
  this.versions.push({
    content: this.content,
    createdAt: new Date(),
    note: note || 'Auto-saved version',
  });
  return this.save();
};

ResumeBuilderSchema.methods.addExport = function (format, url) {
  this.exports.push({
    format,
    url,
    generatedAt: new Date(),
  });
  return this.save();
};

ResumeBuilderSchema.methods.tailorForJob = function (jobId, keywords) {
  this.customization.targetJobId = jobId;
  this.customization.keywords = keywords;
  this.customization.tailoredFor = `Job ID: ${jobId}`;
  return this.save();
};

// Static methods
ResumeBuilderSchema.statics.getDefaultResume = function (candidateId) {
  return this.findOne({
    candidateId,
    isDefault: true,
    status: { $ne: 'archived' },
  });
};

ResumeBuilderSchema.statics.getResumesForCandidate = function (candidateId) {
  return this.find({
    candidateId,
    status: { $ne: 'archived' },
  }).sort({ updatedAt: -1 });
};

// Virtual fields
ResumeBuilderSchema.virtual('latestVersion').get(function () {
  if (this.versions.length === 0) return null;
  return this.versions[this.versions.length - 1];
});

ResumeBuilderSchema.virtual('completionPercentage').get(function () {
  const requiredFields = ['personalInfo', 'summary', 'experience', 'education'];
  const completedFields = requiredFields.filter(
    field =>
      this.content[field] &&
      (Array.isArray(this.content[field])
        ? this.content[field].length > 0
        : this.content[field])
  );
  return Math.round((completedFields.length / requiredFields.length) * 100);
});

module.exports = mongoose.model('ResumeBuilder', ResumeBuilderSchema);
