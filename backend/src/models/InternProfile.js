const mongoose = require('mongoose');

const InternProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  education: {
    university: {
      name: String,
      major: String,
      degree: String,
      graduationYear: Number,
      gpa: Number,
      courses: [String],
      achievements: [String]
    },
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialUrl: String
    }]
  },

  skills: {
    technical: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
      },
      verified: {
        type: Boolean,
        default: false
      },
      endorsements: Number,
      projects: [{
        name: String,
        description: String,
        url: String
      }]
    }],
    soft: [{
      name: String,
      self_assessment: Number
    }],
    languages: [{
      name: String,
      level: String,
      certificate: String
    }]
  },

  experience: {
    internships: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String,
      skills: [String],
      projects: [{
        name: String,
        description: String,
        technologies: [String]
      }]
    }],
    projects: [{
      name: String,
      description: String,
      role: String,
      technologies: [String],
      url: String,
      startDate: Date,
      endDate: Date
    }]
  },

  preferences: {
    locations: [String],
    internshipTypes: [{
      type: String,
      enum: ['full-time', 'part-time', 'remote', 'hybrid']
    }],
    industries: [String],
    minSalary: Number,
    availableFrom: Date,
    duration: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['weeks', 'months']
      }
    }
  },

  resume: {
    current: {
      url: String,
      updatedAt: Date,
      aiAnalysis: {
        skills: [{
          name: String,
          confidence: Number,
          context: String
        }],
        suggestions: [String],
        analyzedAt: Date
      }
    },
    history: [{
      url: String,
      uploadedAt: Date
    }]
  },

  progress: {
    profileCompletion: {
      type: Number,
      default: 0
    },
    skillVerification: {
      completed: Number,
      total: Number
    },
    activeRoadmaps: [{
      roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillRoadmap'
      },
      progress: Number,
      startedAt: Date
    }]
  },

  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    applicationStats: {
      total: Number,
      interviews: Number,
      offers: Number,
      accepted: Number
    },
    skillGrowth: [{
      skill: String,
      startLevel: String,
      currentLevel: String,
      verifiedAt: Date
    }],
    lastActive: Date
  }
}, {
  timestamps: true
});

// Indexes
InternProfileSchema.index({ userId: 1 });
InternProfileSchema.index({ 'education.university.name': 1 });
InternProfileSchema.index({ 'skills.technical.name': 1 });
InternProfileSchema.index({ 'preferences.locations': 1 });
InternProfileSchema.index({ 'analytics.viewCount': -1 });

// Methods
InternProfileSchema.methods.updateProfileCompletion = function() {
  const requiredFields = [
    'education.university',
    'skills.technical',
    'preferences',
    'resume.current'
  ];
  
  let completed = 0;
  requiredFields.forEach(field => {
    if (this.get(field)) completed++;
  });

  this.progress.profileCompletion = Math.round((completed / requiredFields.length) * 100);
  return this.save();
};

InternProfileSchema.methods.updateSkillVerification = function() {
  const technical = this.skills.technical || [];
  
  this.progress.skillVerification = {
    completed: technical.filter(skill => skill.verified).length,
    total: technical.length
  };
  
  return this.save();
};

InternProfileSchema.methods.incrementViews = async function() {
  this.analytics.viewCount += 1;
  this.analytics.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('InternProfile', InternProfileSchema);