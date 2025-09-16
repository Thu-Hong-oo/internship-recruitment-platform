const mongoose = require('mongoose');

const SkillRoadmapSchema = new mongoose.Schema(
  {
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },

    targetJob: {
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
      title: String,
      requiredSkills: [
        {
          name: String,
          level: String,
        },
      ],
    },

    analysis: {
      currentSkills: [
        {
          name: String,
          level: String,
          proficiency: Number,
        },
      ],
      skillGaps: [
        {
          skillName: String,
          currentLevel: String,
          requiredLevel: String,
          gap: Number,
          priority: Number,
        },
      ],
    },

    roadmap: {
      startDate: Date,
      endDate: Date,
      milestones: [
        {
          title: String,
          skills: [
            {
              name: String,
              targetLevel: String,
              resources: [
                {
                  type: String,
                  url: String,
                  description: String,
                },
              ],
              exercises: [
                {
                  title: String,
                  description: String,
                  completed: Boolean,
                },
              ],
            },
          ],
          deadline: Date,
          completed: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },

    progress: {
      overallProgress: {
        type: Number,
        default: 0,
      },
      skillProgress: [
        {
          skillName: String,
          progress: Number,
          lastUpdated: Date,
        },
      ],
      completedMilestones: {
        type: Number,
        default: 0,
      },
      totalMilestones: Number,
    },

    mentorship: {
      mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      feedback: [
        {
          milestone: String,
          comment: String,
          rating: Number,
          date: Date,
        },
      ],
    },

    status: {
      type: String,
      enum: Object.values(
        require('../constants/common.constants').ROADMAP_STATUS
      ),
      default: require('../constants/common.constants').ROADMAP_STATUS.PLANNING,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SkillRoadmapSchema.index({ internId: 1 });
SkillRoadmapSchema.index({ 'targetJob.jobId': 1 });
SkillRoadmapSchema.index({ status: 1 });
SkillRoadmapSchema.index({ 'progress.overallProgress': 1 });

// Methods for roadmap management
SkillRoadmapSchema.methods.updateProgress = async function () {
  const completedMilestones = this.roadmap.milestones.filter(
    m => m.completed
  ).length;
  this.progress.completedMilestones = completedMilestones;
  this.progress.overallProgress =
    (completedMilestones / this.progress.totalMilestones) * 100;
  return this.save();
};

SkillRoadmapSchema.methods.addMentorFeedback = async function (
  milestone,
  feedback
) {
  this.mentorship.feedback.push({
    milestone,
    ...feedback,
    date: new Date(),
  });
  return this.save();
};

module.exports = mongoose.model('SkillRoadmap', SkillRoadmapSchema);
