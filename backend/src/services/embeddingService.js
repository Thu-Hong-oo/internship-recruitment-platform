/**
 * Embedding Service
 * 
 * NOTE: OpenAI embeddings đã được bỏ để tránh phụ thuộc vào ChatGPT API.
 * Hiện tại hệ thống sử dụng Intelligent Recommendations (không cần embeddings).
 * 
 * Nếu cần vector search trong tương lai, có thể:
 * 1. Dùng Gemini embeddings (nếu Google cung cấp)
 * 2. Dùng sentence-transformers (local, free)
 * 3. Dùng các embedding models miễn phí khác
 */

const { logger } = require('../utils/logger');
require('dotenv').config();

class EmbeddingService {
  constructor() {
    // Embedding service đã được disable để tránh phụ thuộc OpenAI
    // Hệ thống sử dụng Intelligent Recommendations thay thế
    this._isInitialized = true;
  }

  /**
   * Check if embedding service is available
   * Always returns false - embeddings are disabled
   */
  isAvailable() {
    return false; // Embeddings disabled - using intelligent recommendations instead
  }

  /**
   * Generate embedding for a single text
   * 
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector (1536 dimensions)
   */
  async generateEmbedding(text) {
    // Embeddings disabled - system uses intelligent recommendations instead
    logger.warn('Embedding service is disabled. Use intelligent recommendations instead.');
    return null;
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * 
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    // Embeddings disabled - system uses intelligent recommendations instead
    logger.warn('Embedding service is disabled. Use intelligent recommendations instead.');
    return [];
  }

  /**
   * Generate embedding for a learning resource
   * Combines title, description, skills, level, and provider into a single text
   * 
   * @param {Object} resource - Resource object
   * @param {string} resource.title - Resource title
   * @param {string} resource.description - Resource description
   * @param {string[]} resource.skills - Skills covered
   * @param {string} resource.level - Difficulty level
   * @param {string} resource.provider - Provider name
   * @param {string} resource.type - Resource type (course, video, etc.)
   * @returns {Promise<number[]>} Embedding vector
   */
  async embedResource(resource) {
    // Embeddings disabled - system uses intelligent recommendations instead
    return null;
  }

  /**
   * Generate embedding for a search query
   * Used when searching for resources
   * 
   * @param {Object} queryParams - Query parameters
   * @param {string} queryParams.skill - Skill to learn
   * @param {string} queryParams.difficulty - Difficulty level
   * @param {string} queryParams.learningStage - Learning stage (remember, understand, etc.)
   * @param {string[]} queryParams.objectives - Learning objectives
   * @returns {Promise<number[]>} Embedding vector
   */
  async embedSearchQuery(queryParams) {
    // Embeddings disabled - system uses intelligent recommendations instead
    return null;
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      model: 'disabled',
      dimensions: 0,
      note: 'Embeddings disabled - using intelligent recommendations instead',
    };
  }
}

module.exports = new EmbeddingService();

