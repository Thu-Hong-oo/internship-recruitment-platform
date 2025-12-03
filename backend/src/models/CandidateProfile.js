const mongoose = require('mongoose');
const {
  SKILL_LEVELS,
  INTERNSHIP_TYPES,
  DURATION_UNITS,
} = require('../constants/common.constants');

const CandidateProfileSchema = new mongoose.Schema(
  {
    // Profile status management
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused'],
      default: 'active',
    },
    pausedAt: Date,
    pauseReason: String,
    autoReactivateAt: Date,
    deletedAt: Date,

    // Profile visibility settings
    settings: {
      visibility: {
        type: String,
        enum: ['public', 'private', 'paused'],
        default: 'public',
      },
      searchable: {
        type: Boolean,
        default: true,
      },
      lastVisibilityChange: Date,
    },

    personalInfo: {
      fullName: String,
      givenName: String,
      familyName: String,
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      },
      phone: String,
      address: {
        street: String,
        ward: String,
        district: String,
        city: String,
        country: { type: String, default: 'Vietnam' },
      },
      bio: { type: String, maxlength: 500 },
      avatar: String,
      website: String,
      linkedin: String,
      github: String,
      jobTitle: String,
    },

    // Target job information for CV optimization
    targetJob: {
      title: String,
      industry: String,
      level: {
        type: String,
        enum: ['entry', 'mid', 'senior', 'executive'],
        default: 'entry',
      },
      salary: String,
      location: String,
      description: String,
      updatedAt: { type: Date, default: Date.now },
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    education: {
      university: {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        type: { type: String, default: 'university' },
        name: String,
        institution: String,
        major: String,
        degree: String,
        field: String,
        startDate: Date,
        endDate: Date,
        graduationYear: Number,
        currentYear: Number,
        gpa: Number,
        courses: [String],
        achievements: [String],
      },
      certifications: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          type: { type: String, default: 'certification' },
          name: String,
          issuer: String,
          institution: String,
          degree: String,
          field: String,
          startDate: Date,
          endDate: Date,
          issueDate: Date,
          expiryDate: Date,
          credentialUrl: String,
          gpa: Number,
          achievements: [String],
        },
      ],
    },

    skills: {
      technical: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
          name: String,
          level: { type: String, enum: Object.values(SKILL_LEVELS) },
          verified: {
            type: Boolean,
            default: false,
          },
          endorsements: { type: Number, default: 0 },
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
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
          name: String,
          level: { type: String, enum: Object.values(SKILL_LEVELS) },
          selfAssessment: { type: Number, min: 1, max: 5 },
          self_assessment: { type: Number, min: 1, max: 5 },
          verified: { type: Boolean, default: false },
          endorsements: { type: Number, default: 0 },
        },
      ],
      languages: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          name: String,
          level: String,
          certificate: String,
          verified: { type: Boolean, default: false },
          endorsements: { type: Number, default: 0 },
        },
      ],
    },

    experience: {
      internships: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
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
      fulltime: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          company: String,
          position: String,
          location: String,
          startDate: Date,
          endDate: Date,
          description: String,
          achievements: [String],
          skills: [String],
          current: { type: Boolean, default: false },
        },
      ],
      parttime: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          company: String,
          position: String,
          location: String,
          startDate: Date,
          endDate: Date,
          description: String,
          achievements: [String],
          skills: [String],
          current: { type: Boolean, default: false },
        },
      ],
      freelance: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          company: String,
          position: String,
          location: String,
          startDate: Date,
          endDate: Date,
          description: String,
          achievements: [String],
          skills: [String],
          current: { type: Boolean, default: false },
        },
      ],
      projects: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          title: String,
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

    // Projects (top level, separate from experience.projects)
    projects: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        title: String,
        description: String,
        technologies: [String],
        startDate: Date,
        endDate: Date,
        status: String,
        url: String,
        github: String,
        achievements: [String],
      },
    ],

    // Certifications (top level, separate from education.certifications)
    certifications: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        url: String,
      },
    ],

    // Awards
    awards: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        title: String,
        issuer: String,
        date: Date,
        description: String,
      },
    ],

    // Hobbies
    hobbies: [String],

    // References
    references: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: String,
        position: String,
        company: String,
        contact: String,
      },
    ],

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
      maxSalary: Number,
      availableFrom: Date,
      careerGoals: String,
      targetRoles: [String],
      duration: {
        min: Number,
        max: Number,
        unit: { type: String, enum: Object.values(DURATION_UNITS) },
      },
      // Learning preferences for personalized roadmap
      learning: {
        style: {
          type: String,
          enum: ['visual', 'reading', 'handsOn'],
          default: 'visual',
        },
        budget: {
          type: String,
          enum: ['free', '< 50', '< 100', 'any'],
          default: 'free',
        },
        maxHoursPerWeek: {
          type: Number,
          default: null, // null means no limit
          min: 1,
          max: 168, // Max hours in a week
        },
        preferredResourceTypes: [{
          type: String,
          enum: ['video', 'course', 'documentation', 'article', 'project', 'book'],
        }],
        preferredLanguage: {
          type: String,
          enum: ['en', 'vi', 'both'],
          default: 'en',
        },
      },
      // Roadmap preferences
      roadmap: {
        preferredPace: {
          type: String,
          enum: ['slow', 'normal', 'fast'],
          default: 'normal',
        },
        focusAreas: [String], // Specific areas to focus on
        skipBasics: {
          type: Boolean,
          default: false, // Skip basics if already know them
        },
      },
    },

    resume: {
      current: {
        url: String,
        publicId: String,
        filename: String,
        displayName: String,
        format: String,
        size: Number,
        mimeType: String,
        updatedAt: Date,
        uploadedAt: Date,
        aiAnalysis: {
          // Extracted raw data from resume
          extractedData: mongoose.Schema.Types.Mixed,

          // Simple skills array (strings)
          skills: [String],

          // Detailed skills analysis (objects) - optional
          detailedSkills: [
            {
              name: String,
              confidence: Number,
              context: String,
              category: String,
              level: String,
            },
          ],

          // AI suggestions for improvement
          suggestions: [String],

          // Analysis metadata
          analyzedAt: Date,
          error: String,
        },
      },
      history: [
        {
          url: String,
          publicId: String,
          filename: String,
          displayName: String,
          format: String,
          size: Number,
          uploadedAt: Date,
        },
      ],
    },

    followedCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployerProfile',
      },
    ],

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
        total: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        interviews: { type: Number, default: 0 },
        offers: { type: Number, default: 0 },
        accepted: { type: Number, default: 0 },
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

// ... rest of the code remains the same

// Indexes
CandidateProfileSchema.index({ userId: 1 });
CandidateProfileSchema.index({ 'education.university.name': 1 });
CandidateProfileSchema.index({ 'skills.technical.name': 1 });
CandidateProfileSchema.index({ 'skills.technical.skillId': 1 });
CandidateProfileSchema.index({ 'skills.soft.skillId': 1 });
CandidateProfileSchema.index({ 'preferences.locations': 1 });
CandidateProfileSchema.index({ 'analytics.viewCount': -1 });

// Methods
CandidateProfileSchema.methods.updateProfileCompletion = function () {
  const requiredFields = [
    'education.university.name', // Check for specific field to avoid auto-creation
    'skills.technical',
    'preferences',
    'resume.current',
  ];

  let completed = 0;
  requiredFields.forEach(field => {
    const value = this.get(field);
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      completed++;
    }
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

// THÊM: Indexes cần thiết
CandidateProfileSchema.index({
  'skills.technical.name': 1,
  'skills.technical.level': 1,
});
CandidateProfileSchema.index({
  'preferences.locations': 1,
  'preferences.industries': 1,
});
// Index for AI analysis skills (now simple strings)
CandidateProfileSchema.index({ 'resume.current.aiAnalysis.skills': 1 });
CandidateProfileSchema.index({
  'resume.current.aiAnalysis.detailedSkills.name': 1,
});
CandidateProfileSchema.index({ userId: 1 }, { unique: true });
CandidateProfileSchema.index({ 'progress.profileCompletion': -1 });

// THÊM: Virtual fields hữu ích
CandidateProfileSchema.virtual('skillsCount').get(function () {
  return (this.skills.technical || []).length;
});

CandidateProfileSchema.virtual('isProfileComplete').get(function () {
  return this.progress.profileCompletion >= 80;
});

CandidateProfileSchema.virtual('topSkills').get(function () {
  return (this.skills.technical || [])
    .filter(skill => skill.level === 'advanced')
    .slice(0, 5);
});

CandidateProfileSchema.virtual('experienceYears').get(function () {
  const internships = this.experience.internships || [];
  if (internships.length === 0) return 0;

  const totalDays = internships.reduce((total, internship) => {
    if (internship.startDate && internship.endDate) {
      const days =
        Math.abs(internship.endDate - internship.startDate) /
        (1000 * 60 * 60 * 24);
      return total + days;
    }
    return total;
  }, 0);

  return Math.round((totalDays / 365) * 10) / 10; // Round to 1 decimal
});

// Pre-save hook to fix address field type issues
CandidateProfileSchema.pre('save', function (next) {
  // Fix address field if it's a string (prevent MongoDB error)
  if (this.personalInfo && this.personalInfo.address !== undefined) {
    if (typeof this.personalInfo.address === 'string') {
      console.log(
        '🔧 Pre-save: Converting address string to prevent MongoDB error'
      );
      const addressString = this.personalInfo.address;

      if (addressString === '') {
        // Empty string - set to null to avoid MongoDB error
        this.personalInfo.address = null;
        console.log('   → Empty string converted to null');
      } else {
        // Non-empty string - convert to object
        this.personalInfo.address = {
          street: '',
          ward: '',
          district: '',
          city: addressString,
          country: 'Vietnam',
        };
        console.log(`   → String "${addressString}" converted to object`);
      }
    }
  }
  next();
});

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
