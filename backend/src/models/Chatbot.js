const mongoose = require('mongoose');

const ChatbotSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    messages: [{
      role: { 
        type: String, 
        enum: ['user', 'assistant', 'system'], 
        required: true 
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      intent: String, // Detected user intent
      confidence: Number, // AI confidence score
      metadata: mongoose.Schema.Types.Mixed
    }],
    context: {
      currentTopic: String,
      userPreferences: mongoose.Schema.Types.Mixed,
      lastJobSearch: {
        keywords: [String],
        location: String,
        filters: mongoose.Schema.Types.Mixed
      }
    },
    isActive: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes
ChatbotSchema.index({ sessionId: 1 });
ChatbotSchema.index({ userId: 1 });
ChatbotSchema.index({ isActive: 1, lastActivity: -1 });

module.exports = mongoose.model('Chatbot', ChatbotSchema);
