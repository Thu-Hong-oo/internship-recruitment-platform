const mongoose = require('mongoose');

const CandidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Thông tin cá nhân
    personalInfo: {
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
      phone: String,
      address: {
        city: String,
        district: String,
        fullAddress: String,
      },
      linkedin: String,
      github: String,
      portfolio: String,
    },
    // Thông tin học vấn (có thể là sinh viên hoặc đã tốt nghiệp)
    education: {
      currentStatus: {
        type: String,
        enum: ['student', 'graduated', 'self-taught', 'career-changer'],
        required: true,
      },
      university: String,
      major: String,
      degree: {
        type: String,
        enum: [
          'High School',
          'Associate',
          'Bachelor',
          'Master',
          'PhD',
          'Diploma',
          'Certificate',
          'None',
        ],
      },
      graduationYear: Number,
      gpa: {
        type: Number,
        min: 0,
        max: 4.0,
      },
      // Cho người đã tốt nghiệp
      yearsSinceGraduation: Number,
      // Cho sinh viên
      expectedGraduation: Date,
      currentSemester: Number,
    },
    // Kinh nghiệm (dự án, thực tập, công việc)
    experience: [
      {
        type: {
          type: String,
          enum: [
            'internship',
            'project',
            'volunteer',
            'part-time',
            'full-time',
            'freelance',
          ],
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        company: String,
        description: String,
        startDate: {
          type: Date,
          required: true,
        },
        endDate: Date,
        isCurrent: {
          type: Boolean,
          default: false,
        },
        skills: [String],
        achievements: [String],
        technologies: [String],
      },
    ],
    // Kỹ năng
    skills: [
      {
        skillId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Skill',
          required: true,
        },
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'beginner',
        },
        experience: {
          type: Number, // months
          default: 0,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        // Cho người chuyển ngành
        isTransferSkill: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Hồ sơ
    resume: {
      url: String,
      filename: String,
      uploadedAt: Date,
      lastUpdated: Date,
    },
    // Sở thích thực tập
    preferences: {
      internshipType: [
        {
          type: String,
          enum: ['full-time', 'part-time', 'remote', 'hybrid'],
        },
      ],
      duration: {
        type: String,
        enum: ['1-month', '3-months', '6-months', '1-year', 'flexible'],
      },
      location: [String],
      industries: [String],
      salaryExpectation: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'VND',
        },
      },
      // Cho người chuyển ngành
      careerGoals: [String],
      preferredRoles: [String],
    },
    // Phân tích AI
    aiAnalysis: {
      skillGaps: [
        {
          skillId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill',
          },
          gapLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
          recommendedLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          },
          priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
        },
      ],
      matchingScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      careerPath: {
        type: String,
        enum: ['entry-level', 'mid-level', 'senior', 'specialist'],
      },
      lastAnalyzed: Date,
    },
    // Trạng thái
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'seeking', 'employed'],
      default: 'active',
    },
    // Cho người chuyển ngành
    careerTransition: {
      fromIndustry: String,
      toIndustry: String,
      transitionReason: String,
      transferableSkills: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CandidateProfileSchema.index({ userId: 1 });
CandidateProfileSchema.index({ 'education.currentStatus': 1 });
CandidateProfileSchema.index({ 'education.university': 1 });
CandidateProfileSchema.index({ 'education.major': 1 });
CandidateProfileSchema.index({ 'skills.skillId': 1 });
CandidateProfileSchema.index({ 'preferences.location': 1 });
CandidateProfileSchema.index({ 'aiAnalysis.matchingScore': -1 });
CandidateProfileSchema.index({ 'careerTransition.fromIndustry': 1 });
CandidateProfileSchema.index({ 'careerTransition.toIndustry': 1 });

// Virtuals
CandidateProfileSchema.virtual('totalExperience').get(function () {
  return this.experience.reduce((total, exp) => {
    const endDate = exp.isCurrent ? new Date() : exp.endDate;
    const duration = endDate - exp.startDate;
    return total + duration / (1000 * 60 * 60 * 24 * 30); // months
  }, 0);
});

CandidateProfileSchema.virtual('skillCount').get(function () {
  return this.skills.length;
});

CandidateProfileSchema.virtual('isStudent').get(function () {
  return this.education.currentStatus === 'student';
});

CandidateProfileSchema.virtual('isCareerChanger').get(function () {
  return this.education.currentStatus === 'career-changer';
});

// Methods
CandidateProfileSchema.methods.getSkillLevel = function (skillId) {
  const skill = this.skills.find(
    s => s.skillId.toString() === skillId.toString()
  );
  return skill ? skill.level : null;
};

CandidateProfileSchema.methods.addSkill = function (
  skillId,
  level = 'beginner',
  experience = 0,
  isTransferSkill = false
) {
  const existingSkill = this.skills.find(
    s => s.skillId.toString() === skillId.toString()
  );

  if (existingSkill) {
    existingSkill.level = level;
    existingSkill.experience = experience;
    existingSkill.isTransferSkill = isTransferSkill;
  } else {
    this.skills.push({
      skillId,
      level,
      experience,
      isTransferSkill,
      addedAt: new Date(),
    });
  }

  return this.save();
};

CandidateProfileSchema.methods.removeSkill = function (skillId) {
  this.skills = this.skills.filter(
    s => s.skillId.toString() !== skillId.toString()
  );
  return this.save();
};

CandidateProfileSchema.methods.addExperience = function (experienceData) {
  this.experience.push(experienceData);
  return this.save();
};

CandidateProfileSchema.methods.updateCareerTransition = function (
  transitionData
) {
  this.careerTransition = { ...this.careerTransition, ...transitionData };
  return this.save();
};

// Statics
CandidateProfileSchema.statics.findBySkill = function (skillId) {
  return this.find({ 'skills.skillId': skillId });
};

CandidateProfileSchema.statics.findByLocation = function (location) {
  return this.find({
    'preferences.location': { $regex: location, $options: 'i' },
  });
};

CandidateProfileSchema.statics.findByUniversity = function (university) {
  return this.find({
    'education.university': { $regex: university, $options: 'i' },
  });
};

CandidateProfileSchema.statics.findStudents = function () {
  return this.find({ 'education.currentStatus': 'student' });
};

CandidateProfileSchema.statics.findCareerChangers = function () {
  return this.find({ 'education.currentStatus': 'career-changer' });
};

CandidateProfileSchema.statics.findByIndustry = function (industry) {
  return this.find({
    $or: [
      { 'careerTransition.fromIndustry': { $regex: industry, $options: 'i' } },
      { 'careerTransition.toIndustry': { $regex: industry, $options: 'i' } },
    ],
  });
};

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
