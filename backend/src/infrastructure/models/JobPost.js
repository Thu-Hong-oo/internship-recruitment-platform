const mongoose = require('mongoose');
const EmploymentType = require('../../domain/recruitment/enums/EmploymentType');
const JobStatus = require('../../domain/recruitment/enums/JobStatus');
const ExperienceLevel = require('../../domain/recruitment/enums/ExperienceLevel');
const WorkFormat = require('../../domain/recruitment/enums/WorkFormat');
const EducationLevel = require('../../domain/recruitment/enums/EducationLevel');
const Visibility = require('../../domain/shared/enums/Visibility');

const JobPostSchema = new mongoose.Schema(
  {
    jobId: { type: String, unique: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: String,
    description: String,
    minSalary: Number,
    maxSalary: Number,
    requiredExperienceLevel: String,
    employmentType: { type: String, enum: Object.values(EmploymentType) },
    requiredEducation: { type: String, enum: Object.values(EducationLevel) },
    viewsCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
    },
    workFormat: { type: String, enum: Object.values(WorkFormat) },
    expiresAt: Date,
    requirements: String,
    responsibilities: String,
    benefits: String,
    skills: [String],
    experienceLevel: { type: String, enum: Object.values(ExperienceLevel) },
    location: Object,
    salaryMin: Number,
    salaryMax: Number,
    currency: String,
    salary: Object, // Keep for backward compatibility
    applicationDeadline: Date,
    metadata: Object,
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt tự động
  }
);

JobPostSchema.methods.isActive = function () {
  return this.status === 'published';
};

JobPostSchema.methods.hasSalaryRange = function () {
  return !!(this.salaryMin && this.salaryMax);
};

JobPostSchema.methods.canApply = function () {
  return (
    this.isActive() &&
    (!this.applicationDeadline || this.applicationDeadline > new Date())
  );
};

JobPostSchema.methods.isExpired = function () {
  return this.applicationDeadline && this.applicationDeadline < new Date();
};

JobPostSchema.methods.incrementView = async function () {
  if (!this.views) this.views = 0;
  this.views += 1;
  await this.save();
};

module.exports = mongoose.model('JobPost', JobPostSchema);
