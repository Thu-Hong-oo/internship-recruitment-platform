const mongoose = require('mongoose');
const ApplicationStatus = require('../../domain/recruitment/enums/ApplicationStatus');

const ApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    cvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CV',
    },
    coverLetterText: String,
    status: { type: String, enum: Object.values(ApplicationStatus) },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    viewedAt: Date,
    employerNotes: String,
    candidateNotes: String,
    metadata: Object,
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt tự động
  }
);

ApplicationSchema.methods.canWithdraw = function () {
  return this.status === 'pending' || this.status === 'reviewing';
};

ApplicationSchema.methods.updateStatus = async function (newStatus) {
  this.status = newStatus;
  await this.save();
  return this;
};

ApplicationSchema.methods.isViewed = function () {
  return !!this.viewedAt;
};

ApplicationSchema.methods.markAsViewed = async function () {
  this.viewedAt = new Date();
  this.status = 'reviewed';
  await this.save();
  return this;
};

ApplicationSchema.methods.getCV = async function () {
  if (this.cvId) {
    return await mongoose.model('CV').findById(this.cvId);
  }

  // If no specific CV, get candidate's default CV
  const candidate = await mongoose
    .model('Candidate')
    .findById(this.candidateId);
  if (candidate && candidate.defaultCV) {
    return await mongoose.model('CV').findById(candidate.defaultCV);
  }

  return null;
};

module.exports = mongoose.model('Application', ApplicationSchema);
