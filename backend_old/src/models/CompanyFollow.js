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
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CompanyFollowSchema.index({ candidateId: 1, employerId: 1 }, { unique: true });
CompanyFollowSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('CompanyFollow', CompanyFollowSchema);
