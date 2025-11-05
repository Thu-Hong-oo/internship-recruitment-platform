/**
 * AI External Services - Export all AI-powered services
 * These services integrate with external AI APIs (Gemini, OpenAI, etc.)
 */

module.exports = {
  // Main AI Service (implemented)
  GeminiAIService: require('./GeminiAIService'),

  // Base AI Service interface
  AIService: require('./aiService'),

  // Other AI adapters (if needed)
  // OpenAIService: require('./openAIAIService'),
};
