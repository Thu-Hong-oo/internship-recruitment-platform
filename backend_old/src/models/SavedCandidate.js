const mongoose = require('mongoose');

const SavedCandidateSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    note: String,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SavedCandidateSchema.index({ employerId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('SavedCandidate', SavedCandidateSchema);

