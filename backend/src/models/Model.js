/**
 * Model Versioning Schema

 * Lưu trữ thông tin về các versions của models:
 * - Embedding models
 * - NER models
 * - Classification models
 */

const mongoose = require('mongoose');

const ModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['embedding', 'ner', 'classifier', 'llm'],
    required: true,
    index: true
  },
  path: {
    type: String,
    required: true
  },
  baseModel: {
    type: String, // e.g., 'sentence-transformers/all-MiniLM-L6-v2'
    default: null
  },
  metrics: {
    accuracy: {
      type: Number,
      default: 0
    },
    f1Score: {
      type: Number,
      default: 0
    },
    precision: {
      type: Number,
      default: 0
    },
    recall: {
      type: Number,
      default: 0
    },
    loss: {
      type: Number,
      default: null
    }
  },
  trainingDataSize: {
    type: Number,
    default: 0
  },
  trainingConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  active: {
    type: Boolean,
    default: false,
    index: true
  },
  deployedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

// Indexes
ModelSchema.index({ type: 1, active: 1 });
ModelSchema.index({ type: 1, 'metrics.f1Score': -1 });
ModelSchema.index({ createdAt: -1 });

const Model = mongoose.model('Model', ModelSchema);

module.exports = Model;

