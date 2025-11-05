// OpenAI Adapter - implements AIService
const AIService = require('./aiService');

class OpenAIAIService extends AIService {
  async analyzeCV(cvData) {
    // TODO: Call OpenAI API for CV analysis
    throw new Error('Not implemented');
  }

  async generateEmbedding(text) {
    // TODO: Call OpenAI API for embedding
    throw new Error('Not implemented');
  }

  async matchCandidateToJob(candidateProfile, jobProfile) {
    // TODO: Call OpenAI API for matching
    throw new Error('Not implemented');
  }
}

module.exports = OpenAIAIService;
