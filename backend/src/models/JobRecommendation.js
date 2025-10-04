const mongoose = require('mongoose');

const JobRecommendationSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CandidateProfile',
    required: true,
    index: true,
  },

  recommendations: [
    {
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      score: Number,
      reason: String,

      matchDetails: {
        skillsMatch: Number,
        experienceMatch: Number,
        educationMatch: Number,
        locationMatch: Number,
        salaryMatch: Number,
      },

      whyGoodFit: [String],
      concerns: [String],
    },
  ],

  filters: {
    skills: [String],
    locations: [String],
    industries: [String],
    salaryRange: {
      min: Number,
      max: Number,
    },
  },

  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: true },

  isStale: { type: Boolean, default: false },
});

// TTL index - tự động xóa sau 24h
JobRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for performance
JobRecommendationSchema.index({ candidateId: 1, generatedAt: -1 });
JobRecommendationSchema.index({ 'recommendations.score': -1 });

// Pre-save middleware để set expiration
JobRecommendationSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    // Expire after 24 hours
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Methods
JobRecommendationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

JobRecommendationSchema.methods.markStale = function () {
  this.isStale = true;
  return this.save();
};

// Static methods
JobRecommendationSchema.statics.getValidRecommendations = function (
  candidateId
) {
  return this.findOne({
    candidateId,
    expiresAt: { $gt: new Date() },
    isStale: false,
  }).populate('recommendations.jobId', 'title company location salary status');
};

module.exports = mongoose.model('JobRecommendation', JobRecommendationSchema);
