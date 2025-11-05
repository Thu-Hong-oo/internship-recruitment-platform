const mongoose = require('mongoose');

/**
 * SavedJob Model
 * Represents jobs saved by candidates for later viewing
 */
const savedJobSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },

    savedAt: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt tự động
  }
);

// Compound index to prevent duplicate saves and optimize queries
savedJobSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

// Index for sorting by save date
savedJobSchema.index({ candidateId: 1, savedAt: -1 });

// Virtual field to check if job is still active
savedJobSchema.virtual('isJobActive').get(function () {
  return this.jobId && this.jobId.status === 'active' && !this.jobId.deletedAt;
});

// Ensure virtual fields are serialized
savedJobSchema.set('toJSON', { virtuals: true });
savedJobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);
