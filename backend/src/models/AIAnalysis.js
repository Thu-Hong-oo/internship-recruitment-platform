const mongoose = require('mongoose');

const AIAnalysisSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: ['cv', 'job', 'skill_assessment'],
    required: true
  },

  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  content: {
    originalText: String,
    processedText: String,
    language: String
  },

  nlpResults: {
    entities: [{
      text: String,
      type: String,
      confidence: Number
    }],
    skills: [{
      name: String,
      level: String,
      confidence: Number,
      context: String
    }],
    keywords: [{
      text: String,
      relevance: Number
    }],
    categories: [{
      name: String,
      confidence: Number
    }],
    summary: String
  },

  matchingAnalysis: {
    overallScore: Number,
    skillMatch: {
      score: Number,
      matches: [{
        skill: String,
        required: String,
        actual: String,
        score: Number
      }]
    },
    recommendations: [{
      type: String,
      description: String,
      priority: Number,
      actionItems: [String]
    }]
  },

  metadata: {
    processingTime: Number,
    modelVersion: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes
AIAnalysisSchema.index({ sourceType: 1, sourceId: 1 });
AIAnalysisSchema.index({ 'nlpResults.skills.name': 1 });
AIAnalysisSchema.index({ 'matchingAnalysis.overallScore': -1 });

// Methods
AIAnalysisSchema.statics.findLatestAnalysis = function(sourceType, sourceId) {
  return this.findOne({
    sourceType,
    sourceId
  }).sort({ createdAt: -1 });
};

AIAnalysisSchema.statics.findBestMatches = function(sourceId, minScore = 0.7) {
  return this.find({
    sourceType: 'cv',
    'matchingAnalysis.overallScore': { $gte: minScore },
    sourceId
  }).sort({ 'matchingAnalysis.overallScore': -1 });
};

module.exports = mongoose.model('AIAnalysis', AIAnalysisSchema);