const mongoose = require('mongoose');

/**
 * Learning Roadmap Model - Lộ trình học tập cá nhân hóa
 * Tạo roadmap dựa trên skill gaps và target job
 */
const LearningRoadmapSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    targetJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },

    targetRole: {
      type: String,
      required: true,
    },

    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },

    // Skill gaps được xác định
    skillGaps: [
      {
        skill: { type: String, required: true },
        currentLevel: {
          type: String,
          enum: ['none', 'beginner', 'intermediate', 'advanced'],
          default: 'none',
        },
        targetLevel: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          required: true,
        },
        priority: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low'],
          default: 'medium',
        },
        importance: { type: Number, min: 0, max: 1 }, // 0-1
      },
    ],

    // Lộ trình học tập chi tiết theo tuần
    phases: [
      {
        phaseNumber: { type: Number, required: true },
        title: { type: String, required: true },
        duration: { type: String }, // "4 weeks"
        objectives: [String],

        weeks: [
          {
            weekNumber: { type: Number, required: true },
            focus: { type: String, required: true },
            learningObjectives: [String],

            // Tài liệu học tập cụ thể
            resources: [
              {
                type: {
                  type: String,
                  enum: [
                    'course',
                    'video',
                    'article',
                    'book',
                    'documentation',
                    'tutorial',
                    'practice',
                  ],
                  required: true,
                },
                title: { type: String, required: true },
                url: String,
                provider: String, // Udemy, Coursera, YouTube, etc.
                duration: String, // "10 hours", "5 weeks"
                difficulty: {
                  type: String,
                  enum: ['beginner', 'intermediate', 'advanced'],
                },
                isFree: { type: Boolean, default: false },
                rating: { type: Number, min: 0, max: 5 },
                language: { type: String, default: 'en' },
                estimatedCost: Number, // in USD
                credibility: {
                  type: Number,
                  min: 0,
                  max: 1,
                  default: 0.7,
                }, // Độ tin cậy 0-1
                certificateOffered: { type: Boolean, default: false },
              },
            ],

            // Dự án thực hành
            projects: [
              {
                title: String,
                description: String,
                difficulty: String,
                estimatedTime: String,
                skills: [String],
              },
            ],

            // Đánh giá
            assessments: [
              {
                type: {
                  type: String,
                  enum: ['quiz', 'project', 'coding-challenge', 'peer-review'],
                },
                description: String,
                passingCriteria: String,
              },
            ],

            timeCommitment: String, // "10-15 hours/week"
          },
        ],
      },
    ],

    // Milestones - Cột mốc quan trọng
    milestones: [
      {
        weekNumber: Number,
        title: String,
        description: String,
        criteria: [String],
        isCompleted: { type: Boolean, default: false },
        completedAt: Date,
      },
    ],

    // Success metrics
    successMetrics: [String],

    // Metadata
    totalDuration: { type: String, required: true }, // "12 weeks"
    estimatedTotalHours: Number,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
      default: 'intermediate',
    },

    // Progress tracking
    progress: {
      currentPhase: { type: Number, default: 1 },
      currentWeek: { type: Number, default: 1 },
      completedWeeks: [Number],
      completedResources: [String], // Array of resource IDs
      overallProgress: { type: Number, default: 0, min: 0, max: 100 }, // Percentage
      startedAt: Date,
      lastUpdatedAt: Date,
      estimatedCompletionDate: Date,
    },

    // AI Generation metadata
    generatedBy: {
      type: String,
      enum: ['ai', 'manual', 'hybrid'],
      default: 'ai',
    },
    aiModelVersion: String,
    generatedAt: { type: Date, default: Date.now },

    // User feedback
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      isHelpful: Boolean,
      submittedAt: Date,
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'abandoned'],
      default: 'active',
    },

    isPersonalized: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: false }, // Có thể share với người khác
  },
  {
    timestamps: true,
  }
);

// Indexes
LearningRoadmapSchema.index({ candidateId: 1, status: 1 });
LearningRoadmapSchema.index({ targetRole: 1, currentLevel: 1 });
LearningRoadmapSchema.index({ 'skillGaps.skill': 1 });
LearningRoadmapSchema.index({ createdAt: -1 });

// Virtual fields
LearningRoadmapSchema.virtual('totalWeeks').get(function () {
  return this.phases.reduce((total, phase) => {
    return total + (phase.weeks ? phase.weeks.length : 0);
  }, 0);
});

LearningRoadmapSchema.virtual('totalResources').get(function () {
  return this.phases.reduce((total, phase) => {
    return (
      total +
      phase.weeks.reduce((weekTotal, week) => {
        return weekTotal + (week.resources ? week.resources.length : 0);
      }, 0)
    );
  }, 0);
});

// Instance methods
LearningRoadmapSchema.methods.updateProgress = function (weekNumber) {
  if (!this.progress.completedWeeks.includes(weekNumber)) {
    this.progress.completedWeeks.push(weekNumber);
  }

  const totalWeeks = this.totalWeeks;
  this.progress.overallProgress = Math.round(
    (this.progress.completedWeeks.length / totalWeeks) * 100
  );

  this.progress.lastUpdatedAt = new Date();

  return this.save();
};

LearningRoadmapSchema.methods.markResourceCompleted = function (resourceId) {
  if (!this.progress.completedResources.includes(resourceId)) {
    this.progress.completedResources.push(resourceId);
  }
  this.progress.lastUpdatedAt = new Date();
  return this.save();
};

LearningRoadmapSchema.methods.getRecommendedResources = function (
  phase,
  week
) {
  try {
    const targetPhase = this.phases.find((p) => p.phaseNumber === phase);
    if (!targetPhase) return [];

    const targetWeek = targetPhase.weeks.find((w) => w.weekNumber === week);
    if (!targetWeek) return [];

    // Sort by credibility and rating
    return targetWeek.resources
      .sort((a, b) => {
        const scoreA = (a.credibility || 0.5) * 0.6 + (a.rating || 3) / 5 * 0.4;
        const scoreB = (b.credibility || 0.5) * 0.6 + (b.rating || 3) / 5 * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 5); // Top 5 resources
  } catch (error) {
    return [];
  }
};

// Static methods
LearningRoadmapSchema.statics.findActiveRoadmap = function (candidateId) {
  return this.findOne({
    candidateId,
    status: 'active',
  }).sort({ createdAt: -1 });
};

LearningRoadmapSchema.statics.findByTargetRole = function (role, level) {
  return this.find({
    targetRole: new RegExp(role, 'i'),
    currentLevel: level,
    isPublic: true,
  }).sort({ 'feedback.rating': -1 });
};

LearningRoadmapSchema.statics.getPopularRoadmaps = function (limit = 10) {
  return this.aggregate([
    {
      $match: { isPublic: true, 'feedback.rating': { $gte: 4 } },
    },
    {
      $group: {
        _id: '$targetRole',
        count: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' },
        roadmaps: { $push: '$$ROOT' },
      },
    },
    { $sort: { count: -1, avgRating: -1 } },
    { $limit: limit },
  ]);
};

module.exports = mongoose.model('LearningRoadmap', LearningRoadmapSchema);
