/**
 * Feedback Model

 * Lưu trữ feedback từ users để cải thiện models:
 * - User corrections
 * - Model predictions vs actual outcomes
 * - Confidence scores
 */

const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cv_parsing', 'job_matching', 'skill_extraction', 'roadmap_generation', 'experience_classification'],
    required: true,
    // Index defined below in compound index
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  predictedOutput: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  userCorrection: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // Index defined below in compound index
  },
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    default: null
  },
  modelVersion: {
    type: String,
    default: null
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  isSignificant: {
    type: Boolean,
    default: false,
    // Index defined below in compound index
  },
  addedToTraining: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    // Index defined below in compound index
  }
});

// Indexes
FeedbackSchema.index({ type: 1, isSignificant: 1, addedToTraining: 1 });
FeedbackSchema.index({ userId: 1, timestamp: -1 });
FeedbackSchema.index({ modelId: 1, timestamp: -1 });

const Feedback = mongoose.model('Feedback', FeedbackSchema);

module.exports = Feedback;

