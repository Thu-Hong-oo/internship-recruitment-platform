const mongoose = require('mongoose');

const CandidateRecommendationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },

  recommendations: [
    {
      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CandidateProfile',
      },
      score: Number,
      rank: Number,

      matchDetails: {
        technicalFit: Number,
        experienceFit: Number,
        educationFit: Number,
        culturalFit: Number,
        growthPotential: Number,
      },

      strengths: [String],
      concerns: [String],
      interviewQuestions: [String],
    },
  ],

  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: true },

  isStale: { type: Boolean, default: false },
});

// TTL index - tự động xóa sau 24h
CandidateRecommendationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Indexes for performance
CandidateRecommendationSchema.index({ jobId: 1, generatedAt: -1 });
CandidateRecommendationSchema.index({ 'recommendations.score': -1 });
CandidateRecommendationSchema.index({ 'recommendations.rank': 1 });

// Pre-save middleware để set expiration
CandidateRecommendationSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    // Expire after 24 hours
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Methods
CandidateRecommendationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

CandidateRecommendationSchema.methods.markStale = function () {
  this.isStale = true;
  return this.save();
};

// Static methods
CandidateRecommendationSchema.statics.getValidRecommendations = function (
  jobId
) {
  return this.findOne({
    jobId,
    expiresAt: { $gt: new Date() },
    isStale: false,
  }).populate('recommendations.candidateId', 'personalInfo skills experience');
};

CandidateRecommendationSchema.statics.getTopCandidates = function (
  jobId,
  limit = 10
) {
  return this.findOne({
    jobId,
    expiresAt: { $gt: new Date() },
    isStale: false,
  }).then(doc => {
    if (!doc) return [];
    return doc.recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  });
};

module.exports = mongoose.model(
  'CandidateRecommendation',
  CandidateRecommendationSchema
);
