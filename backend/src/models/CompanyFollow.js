const mongoose = require('mongoose');

const CompanyFollowSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CompanyFollowSchema.index({ candidateId: 1, employerId: 1 }, { unique: true });

module.exports = mongoose.model('CompanyFollow', CompanyFollowSchema);

