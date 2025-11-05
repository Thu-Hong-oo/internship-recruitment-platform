// Gemini AI Adapter - implements AIService
const AIService = require('./aiService');

class GeminiAIService extends AIService {
  async analyzeCV(cvData) {
    // TODO: Call Gemini API for CV analysis
    // return { atsScore, extractedSkills, suggestions, embedding, analyzedAt, modelVersion }
    throw new Error('Not implemented');
  }

  async generateEmbedding(text) {
    // TODO: Call Gemini API for embedding
    throw new Error('Not implemented');
  }

  async matchCandidateToJob(candidateProfile, jobProfile) {
    // TODO: Call Gemini API for matching
    throw new Error('Not implemented');
  }
}

module.exports = GeminiAIService;
