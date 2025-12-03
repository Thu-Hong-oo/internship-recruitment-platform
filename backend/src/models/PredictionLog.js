/**
 * Prediction Log Model
 * 
 * Lưu trữ logs của tất cả predictions để monitoring:
 * - Model performance tracking
 * - Latency monitoring
 * - Error tracking
 */

const mongoose = require('mongoose');

const PredictionLogSchema = new mongoose.Schema({
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true,
    index: true
  },
  modelVersion: {
    type: String,
    required: true
  },
  modelType: {
    type: String,
    enum: ['embedding', 'ner', 'classifier', 'llm'],
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
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  latency: {
    type: Number, // milliseconds
    required: true
  },
  success: {
    type: Boolean,
    default: true,
    index: true
  },
  error: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for efficient queries
PredictionLogSchema.index({ modelId: 1, timestamp: -1 });
PredictionLogSchema.index({ modelType: 1, timestamp: -1 });
PredictionLogSchema.index({ success: 1, timestamp: -1 });
PredictionLogSchema.index({ timestamp: -1 }); // For time-based queries

// TTL index to auto-delete old logs (optional, 90 days)
PredictionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const PredictionLog = mongoose.model('PredictionLog', PredictionLogSchema);

module.exports = PredictionLog;

