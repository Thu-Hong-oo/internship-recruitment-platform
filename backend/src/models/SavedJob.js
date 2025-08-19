const mongoose = require('mongoose');

const SavedJobSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    jobId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true 
    },
    savedAt: { type: Date, default: Date.now },
    notes: String,
    folder: { type: String, default: 'default' }, // For organizing saved jobs
    isApplied: { type: Boolean, default: false },
    appliedAt: Date
  },
  { timestamps: true }
);

// Indexes
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });
SavedJobSchema.index({ userId: 1, savedAt: -1 });
SavedJobSchema.index({ userId: 1, folder: 1 });

module.exports = mongoose.model('SavedJob', SavedJobSchema);
