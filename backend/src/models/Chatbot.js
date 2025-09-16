const mongoose = require('mongoose');

const ChatbotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: String,
  context: {
    currentTopic: String,
    lastIntent: String,
    parameters: Object
  },
  type: {
    type: String,
    enum: ['cv_review', 'job_search', 'career_guidance', 'skill_development']
  },
  conversation: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system']
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    intent: String,
    entities: [{
      type: String,
      value: String,
      confidence: Number
    }]
  }],
  nlpAnalysis: {
    keywords: [String],
    sentiment: {
      score: Number,
      label: String
    },
    topics: [String]
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['job', 'skill', 'course', 'general']
    },
    content: String,
    confidence: Number,
    metadata: Object
  }],
  feedback: {
    helpful: Boolean,
    rating: Number,
    comments: String
  }
}, {
  timestamps: true
});

ChatbotSchema.index({ userId: 1, sessionId: 1 });
ChatbotSchema.index({ 'conversation.timestamp': 1 });
ChatbotSchema.index({ type: 1 });

module.exports = mongoose.model('Chatbot', ChatbotSchema);
