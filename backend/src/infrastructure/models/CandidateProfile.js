const mongoose = require('mongoose');

const CandidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    personalInfo: {
      fullName: { type: String },
      dateOfBirth: { type: Date },
      gender: { type: String },
      phone: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        country: { type: String },
      },
    },
    professionalInfo: {
      headline: { type: String },
      bio: { type: String },
      portfolioUrl: { type: String },
      linkedInUrl: { type: String },
      githubUrl: { type: String },
    },
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        fieldOfStudy: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        grade: { type: String },
      },
    ],
    experience: [
      {
        company: { type: String },
        position: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        description: { type: String },
        isCurrent: { type: Boolean, default: false },
      },
    ],
    skills: [
      {
        name: { type: String },
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
      },
    ],
    preferences: {
      jobTypes: [{ type: String }],
      locations: [{ type: String }],
      salaryRange: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'VND' },
      },
    },
    resume: {
      url: { type: String },
      uploadedAt: { type: Date },
    },
    profileCompleteness: { type: Number, default: 0 },
    visibility: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
