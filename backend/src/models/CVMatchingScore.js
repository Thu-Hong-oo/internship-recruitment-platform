const mongoose = require('mongoose');

/**
 * CV Matching Score Model
 * Lưu trữ điểm matching chi tiết giữa CV và Job
 * Giúp lọc CV hiệu quả cho nhà tuyển dụng và ứng viên
 */
const CVMatchingScoreSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },

    // Overall matching score (0-100)
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },

    // Detailed scoring breakdown
    scoreBreakdown: {
      // Skills matching (weight: 45%)
      skillsScore: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        weight: { type: Number, default: 0.45 },
        details: {
          requiredSkillsMatched: Number,
          requiredSkillsTotal: Number,
          requiredSkillsMatchRate: Number, // percentage

          niceToHaveSkillsMatched: Number,
          niceToHaveSkillsTotal: Number,
          niceToHaveSkillsMatchRate: Number,

          matchedSkills: [
            {
              skill: String,
              required: Boolean,
              candidateLevel: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced', 'expert'],
              },
              requiredLevel: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced', 'expert'],
              },
              matchScore: Number, // 0-1
            },
          ],

          missingSkills: [
            {
              skill: String,
              required: Boolean,
              importance: Number, // 0-1
              learnability: {
                type: String,
                enum: ['easy', 'moderate', 'hard'],
                default: 'moderate',
              },
            },
          ],
        },
      },

      // Experience matching (weight: 20%)
      experienceScore: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        weight: { type: Number, default: 0.2 },
        details: {
          candidateYearsOfExperience: Number,
          requiredYearsOfExperience: Number,
          experienceGap: Number, // positive = over-qualified, negative = under-qualified

          relevantExperience: [
            {
              position: String,
              company: String,
              duration: String,
              relevanceScore: Number, // 0-1
              keyAchievements: [String],
            },
          ],

          industryMatch: Boolean,
          roleMatch: Boolean,
        },
      },

      // Education matching (weight: 10%)
      educationScore: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        weight: { type: Number, default: 0.1 },
        details: {
          candidateEducationLevel: String,
          requiredEducationLevel: String,
          meetsRequirement: Boolean,
          relevantMajor: Boolean,
          additionalCertifications: [String],
        },
      },

      // Keyword & semantic similarity (weight: 15%)
      keywordScore: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        weight: { type: Number, default: 0.15 },
        details: {
          jaccardSimilarity: Number,
          cosineSimilarity: Number,
          semanticSimilarity: Number,
          commonKeywords: [String],
          topMatchingPhrases: [String],
        },
      },

      // Cultural fit & soft skills (weight: 10%)
      softSkillsScore: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        weight: { type: Number, default: 0.1 },
        details: {
          communicationSkills: Number,
          teamwork: Number,
          leadership: Number,
          problemSolving: Number,
          adaptability: Number,
          detectedSoftSkills: [String],
        },
      },
    },

    // AI-generated insights
    insights: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      culturalFitScore: { type: Number, min: 0, max: 1 },
      potentialForGrowth: {
        type: String,
        enum: ['low', 'medium', 'high', 'excellent'],
      },
    },

    // Compatibility predictions
    predictions: {
      successProbability: { type: Number, min: 0, max: 1 }, // 0-1
      retentionScore: { type: Number, min: 0, max: 1 }, // Likelihood to stay long-term
      performanceScore: { type: Number, min: 0, max: 1 }, // Expected performance
      hiringRecommendation: {
        type: String,
        enum: ['highly-recommended', 'recommended', 'consider', 'not-recommended'],
      },
    },

    // Ranking data
    ranking: {
      positionInQueue: Number, // Position among all applicants
      totalApplicants: Number,
      percentile: Number, // 0-100
      tier: {
        type: String,
        enum: ['top', 'high', 'medium', 'low'],
      },
    },

    // Metadata
    calculatedAt: { type: Date, default: Date.now, index: true },
    calculationMethod: {
      type: String,
      enum: ['nlp-basic', 'nlp-advanced', 'ml-model', 'hybrid'],
      default: 'nlp-advanced',
    },
    modelVersion: String,
    processingTime: Number, // in milliseconds

    // For caching and optimization
    isStale: { type: Boolean, default: false }, // Mark for recalculation
    lastRecalculatedAt: Date,
    recalculationReason: String,

    // Employer actions
    employerViewed: { type: Boolean, default: false },
    employerViewedAt: Date,
    employerFeedback: {
      accurate: Boolean,
      comment: String,
      submittedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
CVMatchingScoreSchema.index({ jobId: 1, overallScore: -1 });
CVMatchingScoreSchema.index({ candidateId: 1, overallScore: -1 });
CVMatchingScoreSchema.index({
  jobId: 1,
  'ranking.tier': 1,
  overallScore: -1,
});
CVMatchingScoreSchema.index({ calculatedAt: -1 });
CVMatchingScoreSchema.index({ isStale: 1, calculatedAt: 1 });

// Virtual fields
CVMatchingScoreSchema.virtual('isTopCandidate').get(function () {
  return this.overallScore >= 80 && this.ranking.tier === 'top';
});

CVMatchingScoreSchema.virtual('matchGrade').get(function () {
  if (this.overallScore >= 90) return 'A+';
  if (this.overallScore >= 85) return 'A';
  if (this.overallScore >= 80) return 'B+';
  if (this.overallScore >= 75) return 'B';
  if (this.overallScore >= 70) return 'C+';
  if (this.overallScore >= 65) return 'C';
  return 'D';
});

// Instance methods
CVMatchingScoreSchema.methods.getMatchSummary = function () {
  return {
    overallScore: this.overallScore,
    matchGrade: this.matchGrade,
    tier: this.ranking.tier,
    strengths: this.insights.strengths.slice(0, 3),
    weaknesses: this.insights.weaknesses.slice(0, 3),
    recommendation: this.predictions.hiringRecommendation,
    topSkillsMatched:
      this.scoreBreakdown.skillsScore.details.matchedSkills
        .slice(0, 5)
        .map((s) => s.skill) || [],
  };
};

CVMatchingScoreSchema.methods.markAsStale = function (reason) {
  this.isStale = true;
  this.recalculationReason = reason;
  return this.save();
};

// Static methods
CVMatchingScoreSchema.statics.getTopCandidates = function (
  jobId,
  limit = 20,
  minScore = 70
) {
  return this.find({
    jobId,
    overallScore: { $gte: minScore },
  })
    .sort({ overallScore: -1, calculatedAt: -1 })
    .limit(limit)
    .populate('candidateId', 'fullName email profile')
    .lean();
};

CVMatchingScoreSchema.statics.getCandidateMatchesForJobs = function (
  candidateId,
  limit = 10
) {
  return this.find({
    candidateId,
    overallScore: { $gte: 60 },
  })
    .sort({ overallScore: -1 })
    .limit(limit)
    .populate('jobId')
    .lean();
};

CVMatchingScoreSchema.statics.getMatchStatistics = async function (jobId) {
  const stats = await this.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
    {
      $group: {
        _id: null,
        totalCandidates: { $sum: 1 },
        averageScore: { $avg: '$overallScore' },
        maxScore: { $max: '$overallScore' },
        minScore: { $min: '$overallScore' },
        topTierCount: {
          $sum: { $cond: [{ $eq: ['$ranking.tier', 'top'] }, 1, 0] },
        },
        highTierCount: {
          $sum: { $cond: [{ $eq: ['$ranking.tier', 'high'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || {};
};

CVMatchingScoreSchema.statics.findStaleScores = function () {
  return this.find({
    isStale: true,
  })
    .sort({ calculatedAt: 1 })
    .limit(100);
};

// Update ranking after new score calculation
CVMatchingScoreSchema.statics.updateRankings = async function (jobId) {
  const scores = await this.find({ jobId }).sort({ overallScore: -1 });

  const totalApplicants = scores.length;

  for (let i = 0; i < scores.length; i++) {
    const score = scores[i];
    const percentile = ((totalApplicants - i) / totalApplicants) * 100;

    let tier = 'low';
    if (percentile >= 90) tier = 'top';
    else if (percentile >= 70) tier = 'high';
    else if (percentile >= 40) tier = 'medium';

    score.ranking = {
      positionInQueue: i + 1,
      totalApplicants,
      percentile: Math.round(percentile),
      tier,
    };

    await score.save();
  }
};

module.exports = mongoose.model('CVMatchingScore', CVMatchingScoreSchema);
