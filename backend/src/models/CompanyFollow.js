const mongoose = require('mongoose');

const CompanyFollowSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      // Index defined below in compound index
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      // Index defined below in compound index
    },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CompanyFollowSchema.index({ candidateId: 1, employerId: 1 }, { unique: true });
CompanyFollowSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('CompanyFollow', CompanyFollowSchema);
