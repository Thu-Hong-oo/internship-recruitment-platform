// AI Service Interface Skeleton
// Strategy pattern: implement GeminiAIService, OpenAIAIService, ...

class AIService {
  /**
   * Analyze a CV and return analysis result (skills, atsScore, suggestions, embedding, etc.)
   * @param {Object} cvData - { text, fileUrl, ... }
   * @returns {Promise<Object>} analysis result
   */
  async analyzeCV(cvData) {
    throw new Error('analyzeCV() must be implemented by subclass');
  }

  /**
   * Generate vector embedding for a given text
   * @param {String} text
   * @returns {Promise<{embedding: number[], modelVersion: string}>}
   */
  async generateEmbedding(text) {
    throw new Error('generateEmbedding() must be implemented by subclass');
  }

  /**
   * Match a candidate to a job and return match result
   * @param {Object} candidateProfile
   * @param {Object} jobProfile
   * @returns {Promise<Object>} match result
   */
  async matchCandidateToJob(candidateProfile, jobProfile) {
    throw new Error('matchCandidateToJob() must be implemented by subclass');
  }
}

module.exports = AIService;
