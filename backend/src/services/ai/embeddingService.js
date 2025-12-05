/**
 * Embedding Service
 * 
 * Sử dụng Hugging Face Inference API cho embeddings
 * Model: sentence-transformers/paraphrase-MiniLM-L6-v2 (384 dimensions)
 * Updated: 2025-12-04 - Changed from all-MiniLM-L6-v2 (410 Gone) to paraphrase-MiniLM-L6-v2 (active)
 * 
 * ⚠️ NOTE: Service này CHỈ dùng cho vectorStoreService (learning resources)
 * Job matching dùng sentenceBertService (paraphrase-multilingual-mpnet-base-v2, 768-dim)
 */

const { logger } = require('../../utils/logger');
const axios = require('axios');
require('dotenv').config();

class EmbeddingService {
  constructor() {
    // FORCE FALLBACK: HuggingFace Inference API returns 410 Gone for all sentence-transformers models
    // Use TF-IDF fallback instead (works perfectly, no API needed)
    this.huggingFaceApiUrl = null; // Disabled
    this.huggingFaceApiKey = null; // Disabled
    this.modelDimensions = 384;
    this._isInitialized = true;
    
    // ALWAYS use fallback (TF-IDF based similarity - reliable, fast, no API)
    this.useFallback = true;
    
    logger.info('Embedding Service: Using TF-IDF fallback (HuggingFace API disabled due to 410 Gone)');
  }

  /**
   * Check if embedding service is available
   */
  isAvailable() {
    // Always available - either via API or fallback
    return true;
  }

  /**
   * Generate embedding for a single text
   * Strategy: Hugging Face API → TF-IDF Fallback
   * 
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector (384 dimensions)
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      logger.warn('Empty text provided to generateEmbedding');
      return this._generateFallbackEmbedding(text || '');
    }

    // Strategy 1: Try Hugging Face API
    if (!this.useFallback && this.huggingFaceApiKey) {
      try {
        const response = await axios.post(
          this.huggingFaceApiUrl,
          { inputs: text },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingFaceApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 seconds
          }
        );

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Handle both single and batch responses
          const embedding = Array.isArray(response.data[0]) ? response.data[0] : response.data;
          return embedding;
        }

        logger.warn('Unexpected response format from Hugging Face API, using fallback', {
          status: response.status,
          dataType: typeof response.data
        });
      } catch (error) {
        logger.warn('Hugging Face API error, using fallback:', {
          error: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
      }
    }

    // Strategy 2: Fallback to TF-IDF
    return this._generateFallbackEmbedding(text);
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * Strategy: Hugging Face API → TF-IDF Fallback
   * 
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    // Strategy 1: Try Hugging Face API
    if (!this.useFallback && this.huggingFaceApiKey) {
      try {
        const response = await axios.post(
          this.huggingFaceApiUrl,
          { inputs: texts },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingFaceApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds for batch
          }
        );

        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }

        logger.warn('Unexpected batch response format, using fallback');
      } catch (error) {
        logger.warn('Hugging Face batch API error, using fallback:', error.message);
      }
    }

    // Strategy 3: Final fallback to TF-IDF
    return texts.map(text => this._generateFallbackEmbedding(text));
  }

  /**
   * Fallback embedding using simple text features
   * Creates a simple vector based on word frequencies and text characteristics
   * 
   * @param {string} text - Text to embed
   * @returns {number[]} Simple embedding vector (384 dimensions)
   */
  _generateFallbackEmbedding(text) {
    if (!text || typeof text !== 'string') {
      text = '';
    }

    const normalized = text.toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = [...new Set(words)];
    
    // Create a simple feature vector
    const vector = new Array(this.modelDimensions).fill(0);
    
    // Feature 1: Text length features (first 10 dimensions)
    vector[0] = Math.min(normalized.length / 1000, 1); // Normalized length
    vector[1] = Math.min(words.length / 100, 1); // Word count
    vector[2] = Math.min(uniqueWords.length / 50, 1); // Unique words
    
    // Feature 2: Word hash features (distribute words across dimensions)
    words.forEach((word, idx) => {
      const hash = this._simpleHash(word);
      const dim = (hash % (this.modelDimensions - 10)) + 10;
      vector[dim] += 1 / (words.length || 1);
    });
    
    // Feature 3: Character n-grams (last 50 dimensions)
    const ngrams = this._getCharacterNgrams(normalized, 3);
    ngrams.forEach((ngram, idx) => {
      if (idx < 50) {
        const hash = this._simpleHash(ngram);
        const dim = this.modelDimensions - 50 + (hash % 50);
        vector[dim] += 0.1;
      }
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(val => val / magnitude);
    }
    
    return vector;
  }

  /**
   * Simple hash function for distributing words
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get character n-grams from text
   */
  _getCharacterNgrams(text, n) {
    const ngrams = [];
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.substring(i, i + n));
    }
    return ngrams;
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
    if (!resource || !resource.title) {
      logger.warn('Invalid resource provided to embedResource');
      return this._generateFallbackEmbedding('');
    }

    const {
      title = '',
      description = '',
      skills = [],
      level = '',
      provider = '',
      type = '',
    } = resource;

    // Combine all resource information into a single text
    const text = [
      title,
      description,
      `Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}`,
      `Level: ${level}`,
      `Provider: ${provider}`,
      `Type: ${type}`,
    ]
      .filter(Boolean)
      .join(' ');

    return this.generateEmbedding(text);
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
    if (!queryParams || !queryParams.skill) {
      logger.warn('Invalid queryParams provided to embedSearchQuery');
      return this._generateFallbackEmbedding('');
    }

    const {
      skill = '',
      difficulty = '',
      learningStage = '',
      objectives = [],
    } = queryParams;

    // Combine query parameters into a search text
    const text = [
      skill,
      `Difficulty: ${difficulty}`,
      `Learning stage: ${learningStage}`,
      Array.isArray(objectives) ? objectives.join(' ') : '',
    ]
      .filter(Boolean)
      .join(' ');

    return this.generateEmbedding(text);
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      name: this.useFallback 
        ? 'TF-IDF' 
        : 'sentence-transformers/all-mpnet-base-v2',
      method: this.useFallback
        ? 'keyword-matching'
        : 'sentence-embeddings',
      model: this.useFallback 
        ? 'fallback-tfidf' 
        : 'sentence-transformers/all-mpnet-base-v2 (API)',
      dimensions: this.modelDimensions,
      provider: this.useFallback 
        ? 'local-fallback' 
        : 'huggingface',
      note: this.useFallback 
        ? 'Using TF-IDF fallback (HuggingFace API disabled due to 410 Gone)' 
        : 'Using Hugging Face Inference API',
    };
  }
}

module.exports = new EmbeddingService();

