/**
 * Embedding Service
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 * 
 * Model: text-embedding-3-small
 * Dimensions: 1536
 * Cost: ~$0.02 per 1M tokens (very cheap)
 */

const { OpenAI } = require('openai');
const { logger } = require('../utils/logger');
require('dotenv').config();

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = 'text-embedding-3-small';
    this.dimensions = 1536;
  }

  /**
   * Generate embedding for a single text
   * 
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector (1536 dimensions)
   */
  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        logger.warn('Empty text provided to generateEmbedding');
        return null;
      }

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text.trim(),
        dimensions: this.dimensions,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding:', {
        error: error.message,
        text: text?.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * 
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        return [];
      }

      // Filter out empty texts
      const validTexts = texts.filter(
        (text) => text && typeof text === 'string' && text.trim().length > 0
      );

      if (validTexts.length === 0) {
        return [];
      }

      // OpenAI supports up to 2048 inputs per request
      const batchSize = 100; // Safe batch size
      const batches = [];
      
      for (let i = 0; i < validTexts.length; i += batchSize) {
        batches.push(validTexts.slice(i, i + batchSize));
      }

      const allEmbeddings = [];
      
      for (const batch of batches) {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
          dimensions: this.dimensions,
        });

        const embeddings = response.data.map((item) => item.embedding);
        allEmbeddings.push(...embeddings);
      }

      return allEmbeddings;
    } catch (error) {
      logger.error('Error generating batch embeddings:', {
        error: error.message,
        batchSize: texts.length,
      });
      throw error;
    }
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
    try {
      const {
        title = '',
        description = '',
        skills = [],
        level = '',
        provider = '',
        type = '',
      } = resource;

      // Combine all relevant information into a single text
      // This helps with semantic search
      const text = `
        ${title}
        ${description}
        Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
        Level: ${level}
        Provider: ${provider}
        Type: ${type}
      `.trim();

      return this.generateEmbedding(text);
    } catch (error) {
      logger.error('Error embedding resource:', {
        error: error.message,
        resourceId: resource.id || resource._id,
      });
      throw error;
    }
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
    try {
      const {
        skill = '',
        difficulty = '',
        learningStage = '',
        objectives = [],
      } = queryParams;

      const stageDescriptions = {
        remember: 'introduction basics fundamentals',
        understand: 'concepts principles theory',
        apply: 'practice exercises projects',
        analyze: 'advanced techniques optimization',
        evaluate: 'best practices comparisons',
        create: 'build develop implement',
      };

      const text = `
        Learn ${skill} programming development tutorial course
        for ${difficulty} level
        ${stageDescriptions[learningStage] || ''}
        ${Array.isArray(objectives) ? objectives.join(' ') : objectives}
      `.trim();

      return this.generateEmbedding(text);
    } catch (error) {
      logger.error('Error embedding search query:', {
        error: error.message,
        queryParams,
      });
      throw error;
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      model: this.model,
      dimensions: this.dimensions,
      costPer1MTokens: 0.02, // USD
    };
  }
}

module.exports = new EmbeddingService();

