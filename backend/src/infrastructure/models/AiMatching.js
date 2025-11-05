/**
 * AiMatching Model
 * Infrastructure Layer - AI/NLP Domain
 * MongoDB schema for AI matching results
 */
const mongoose = require('mongoose');

const aiMatchingSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      index: true,
    },
    skillMatch: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    experienceMatch: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    educationMatch: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    locationMatch: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    recommendations: [
      {
        type: String,
        trim: true,
      },
    ],
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    matchType: {
      type: String,
      required: true,
      enum: ['initial', 'refined', 'manual', 'auto'],
      default: 'auto',
    },
    matchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      processingTime: Number, // in milliseconds
      algorithmVersion: String,
      featuresUsed: [String],
      additionalData: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'ai_matchings',
  }
);

// Compound indexes for efficient queries
aiMatchingSchema.index({ candidateId: 1, matchedAt: -1 });
aiMatchingSchema.index({ jobId: 1, matchedAt: -1 });
aiMatchingSchema.index({ candidateId: 1, jobId: 1 });
aiMatchingSchema.index({ overallScore: -1, matchedAt: -1 });
aiMatchingSchema.index({ matchType: 1, matchedAt: -1 });

// Virtual for formatted score
aiMatchingSchema.virtual('scorePercentage').get(function () {
  return Math.round(this.overallScore * 100);
});

// Instance method to get match quality
aiMatchingSchema.methods.getMatchQuality = function () {
  if (this.overallScore >= 0.8) return 'excellent';
  if (this.overallScore >= 0.6) return 'good';
  if (this.overallScore >= 0.4) return 'fair';
  return 'poor';
};

// Static method to find high-quality matches
aiMatchingSchema.statics.findHighQualityMatches = function (
  minScore = 0.7,
  limit = 100
) {
  return this.find({ overallScore: { $gte: minScore } })
    .sort({ overallScore: -1, matchedAt: -1 })
    .limit(limit)
    .populate('candidateId', 'firstName lastName email skills')
    .populate('jobId', 'title company requiredSkills');
};

// Static method to get match statistics
aiMatchingSchema.statics.getStatistics = async function (filters = {}) {
  const query = {};
  if (filters.fromDate) query.matchedAt = { $gte: filters.fromDate };
  if (filters.toDate)
    query.matchedAt = { ...query.matchedAt, $lte: filters.toDate };

  return await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalMatches: { $sum: 1 },
        averageScore: { $avg: '$overallScore' },
        maxScore: { $max: '$overallScore' },
        minScore: { $min: '$overallScore' },
        scoreDistribution: {
          $bucket: {
            groupBy: '$overallScore',
            boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
            default: 'Other',
            output: { count: { $sum: 1 } },
          },
        },
      },
    },
  ]);
};

module.exports = mongoose.model('AiMatching', aiMatchingSchema);
