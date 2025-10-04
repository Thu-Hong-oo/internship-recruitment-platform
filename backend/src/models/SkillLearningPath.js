const mongoose = require('mongoose');

const SkillLearningPathSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      unique: true,
    },

    levels: [
      {
        name: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced'],
          required: true,
        },
        description: String,
        criteria: [String],
        assessment: {
          type: String,
          enum: ['self', 'test', 'project', 'interview'],
        },
        estimatedDuration: {
          value: Number,
          unit: {
            type: String,
            enum: ['hours', 'days', 'weeks', 'months'],
          },
        },
      },
    ],

    prerequisites: [
      {
        skillId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Skill',
        },
        level: String,
        required: Boolean,
      },
    ],

    resources: [
      {
        type: {
          type: String,
          enum: ['video', 'article', 'exercise', 'project', 'quiz', 'course'],
        },
        title: String,
        url: String,
        provider: String,
        duration: Number, // in minutes
        difficulty: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced'],
        },
        relevantLevel: String,
        cost: {
          type: String,
          enum: ['free', 'paid', 'freemium'],
        },
        rating: Number,
        tags: [String],
      },
    ],

    milestones: [
      {
        name: String,
        description: String,
        level: String,
        tasks: [String],
        evaluation: String,
        estimatedTime: Number,
        projects: [
          {
            title: String,
            description: String,
            difficulty: String,
            technologies: [String],
            repository: String,
          },
        ],
      },
    ],

    careerPaths: [
      {
        pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerPath' },
        relevance: Number, // 1-10
        requiredLevel: String,
      },
    ],

    relatedSkills: [
      {
        skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
        relationship: {
          type: String,
          enum: ['prerequisite', 'complementary', 'alternative', 'advanced'],
        },
        strength: Number, // 1-10
      },
    ],

    marketData: {
      jobDemand: {
        level: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
        trend: {
          type: String,
          enum: ['declining', 'stable', 'growing', 'emerging'],
        },
        lastUpdated: Date,
      },
      salaryImpact: {
        percentage: Number, // % increase in salary
        confidence: Number,
        lastUpdated: Date,
      },
    },

    learningStats: {
      averageCompletionTime: Number, // days
      successRate: Number, // %
      difficultyRating: Number, // 1-10
      popularityScore: Number,
      lastCalculated: Date,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
SkillLearningPathSchema.index({ skillId: 1 });
SkillLearningPathSchema.index({ 'careerPaths.pathId': 1 });
SkillLearningPathSchema.index({ 'marketData.jobDemand.level': 1 });
SkillLearningPathSchema.index({ 'learningStats.popularityScore': -1 });

// Methods
SkillLearningPathSchema.methods.getResourcesByLevel = function (level) {
  return this.resources.filter(
    resource =>
      resource.relevantLevel === level || resource.difficulty === level
  );
};

SkillLearningPathSchema.methods.getMilestonesByLevel = function (level) {
  return this.milestones.filter(milestone => milestone.level === level);
};

SkillLearningPathSchema.methods.getEstimatedLearningTime = function (
  targetLevel = 'advanced'
) {
  const levelOrder = ['beginner', 'intermediate', 'advanced'];
  const targetIndex = levelOrder.indexOf(targetLevel);

  return this.levels.slice(0, targetIndex + 1).reduce((total, level) => {
    return total + (level.estimatedDuration?.value || 0);
  }, 0);
};

SkillLearningPathSchema.methods.getNextMilestone = function (currentLevel) {
  const levelOrder = ['beginner', 'intermediate', 'advanced'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  const nextLevel = levelOrder[currentIndex + 1];

  if (!nextLevel) return null;

  return this.milestones.find(milestone => milestone.level === nextLevel);
};

// Static methods
SkillLearningPathSchema.statics.getByCareerPath = function (careerPathId) {
  return this.find({ 'careerPaths.pathId': careerPathId })
    .populate('skillId', 'name category')
    .sort({ 'careerPaths.relevance': -1 });
};

SkillLearningPathSchema.statics.getTrendingPaths = function (limit = 10) {
  return this.find({
    'marketData.jobDemand.trend': { $in: ['growing', 'emerging'] },
    isActive: true,
  })
    .populate('skillId', 'name category')
    .sort({ 'learningStats.popularityScore': -1 })
    .limit(limit);
};

SkillLearningPathSchema.statics.getHighDemandPaths = function (limit = 10) {
  return this.find({
    'marketData.jobDemand.level': { $in: ['high', 'critical'] },
    isActive: true,
  })
    .populate('skillId', 'name category')
    .sort({ 'marketData.salaryImpact.percentage': -1 })
    .limit(limit);
};

module.exports = mongoose.model('SkillLearningPath', SkillLearningPathSchema);
