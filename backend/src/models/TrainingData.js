/**
 * Training Data Model
 * 
 * Lưu trữ dữ liệu training cho các models:
 * - CV parsing data
 * - Job matching data
 * - Skill extraction data
 * - Roadmap generation data
 */

const mongoose = require('mongoose');

const TrainingDataSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cv_parsing', 'job_matching', 'skill_extraction', 'roadmap_generation', 'experience_classification'],
    required: true,
    index: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    source: {
      type: String,
      enum: ['user_feedback', 'api_response', 'manual_label', 'system_generated'],
      default: 'system_generated'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    quality: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    verified: {
      type: Boolean,
      default: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CV',
      default: null
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
TrainingDataSchema.index({ type: 1, 'metadata.verified': 1 });
TrainingDataSchema.index({ 'metadata.source': 1, createdAt: -1 });
TrainingDataSchema.index({ 'metadata.quality': -1 });

// Update updatedAt on save
TrainingDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const TrainingData = mongoose.model('TrainingData', TrainingDataSchema);

module.exports = TrainingData;

