const mongoose = require('mongoose');
const {
  SKILL_LEVELS,
  INTERNSHIP_TYPES,
  DURATION_UNITS,
} = require('../constants/common.constants');

const CandidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    education: {
      university: {
        name: String,
        major: String,
        degree: String,
        graduationYear: Number,
        gpa: Number,
        courses: [String],
        achievements: [String],
      },
      certifications: [
        {
          name: String,
          issuer: String,
          issueDate: Date,
          expiryDate: Date,
          credentialUrl: String,
        },
      ],
    },

    skills: {
      technical: [
        {
          name: String,
          level: { type: String, enum: Object.values(SKILL_LEVELS) },
          verified: {
            type: Boolean,
            default: false,
          },
          endorsements: Number,
          projects: [
            {
              name: String,
              description: String,
              url: String,
            },
          ],
        },
      ],
      soft: [
        {
          name: String,
          self_assessment: Number,
        },
      ],
      languages: [
        {
          name: String,
          level: String,
          certificate: String,
        },
      ],
    },

    experience: {
      internships: [
        {
          company: String,
          position: String,
          startDate: Date,
          endDate: Date,
          description: String,
          skills: [String],
          projects: [
            {
              name: String,
              description: String,
              technologies: [String],
            },
          ],
        },
      ],
      projects: [
        {
          name: String,
          description: String,
          role: String,
          technologies: [String],
          url: String,
          startDate: Date,
          endDate: Date,
        },
      ],
    },

    preferences: {
      locations: [String],
      internshipTypes: [
        {
          type: String,
          enum: Object.values(INTERNSHIP_TYPES),
        },
      ],
      industries: [String],
      minSalary: Number,
      availableFrom: Date,
      duration: {
        min: Number,
        max: Number,
        unit: { type: String, enum: Object.values(DURATION_UNITS) },
      },
    },

    resume: {
      current: {
        url: String,
        updatedAt: Date,
        aiAnalysis: {
          skills: [
            {
              name: String,
              confidence: Number,
              context: String,
            },
          ],
          suggestions: [String],
          analyzedAt: Date,
        },
      },
      history: [
        {
          url: String,
          uploadedAt: Date,
        },
      ],
    },

    progress: {
      profileCompletion: {
        type: Number,
        default: 0,
      },
      skillVerification: {
        completed: Number,
        total: Number,
      },
      activeRoadmaps: [
        {
          roadmapId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SkillRoadmap',
          },
          progress: Number,
          startedAt: Date,
        },
      ],
    },

    analytics: {
      viewCount: {
        type: Number,
        default: 0,
      },
      applicationStats: {
        total: Number,
        interviews: Number,
        offers: Number,
        accepted: Number,
      },
      skillGrowth: [
        {
          skill: String,
          startLevel: String,
          currentLevel: String,
          verifiedAt: Date,
        },
      ],
      lastActive: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CandidateProfileSchema.index({ userId: 1 });
CandidateProfileSchema.index({ 'education.university.name': 1 });
CandidateProfileSchema.index({ 'skills.technical.name': 1 });
CandidateProfileSchema.index({ 'preferences.locations': 1 });
CandidateProfileSchema.index({ 'analytics.viewCount': -1 });

// Methods
CandidateProfileSchema.methods.updateProfileCompletion = function () {
  const requiredFields = [
    'education.university',
    'skills.technical',
    'preferences',
    'resume.current',
  ];

  let completed = 0;
  requiredFields.forEach(field => {
    if (this.get(field)) completed++;
  });

  this.progress.profileCompletion = Math.round(
    (completed / requiredFields.length) * 100
  );
  return this.save();
};

CandidateProfileSchema.methods.updateSkillVerification = function () {
  const technical = this.skills.technical || [];

  this.progress.skillVerification = {
    completed: technical.filter(skill => skill.verified).length,
    total: technical.length,
  };

  return this.save();
};

CandidateProfileSchema.methods.incrementViews = async function () {
  this.analytics.viewCount += 1;
  this.analytics.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
