/**
 * 🧠 Sentence-BERT Embedding Service
 * 
 * SELF-SUFFICIENT NLP service for:
 * - Text embedding generation (multilingual)
 * - Semantic similarity calculation
 * - CV-Job matching
 * 
 * Model: paraphrase-multilingual-mpnet-base-v2 (768 dim)
 * Source: sentence-transformers/paraphrase-multilingual-mpnet-base-v2
 * 
 * NO external API dependency - runs locally with Python
 */

const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../../utils/logger');

class SentenceBertService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../../python/sentence_bert_inference.py');
    this.modelName = 'paraphrase-multilingual-mpnet-base-v2';
    this.embeddingDim = 768;
    this.isAvailable = false;
    
    // Check if model is available
    this._checkAvailability();
  }

  /**
   * Check if Sentence-BERT model is available
   */
  async _checkAvailability() {
    try {
      const result = await this._runPython(['--check']);
      this.isAvailable = result.success;
      
      if (this.isAvailable) {
        logger.info(`✅ Sentence-BERT model available: ${this.modelName}`);
        // Pre-warm model with dummy encoding to speed up first real request
        try {
          await this._runPython(['--encode', 'warmup']);
          logger.info('✅ Sentence-BERT model pre-warmed');
        } catch (warmupError) {
          logger.warn('⚠️ Model warmup failed:', warmupError.message);
        }
      } else {
        logger.warn('⚠️ Sentence-BERT model not available. Run: pip install sentence-transformers');
        this.isAvailable = false;
      }
    } catch (error) {
      // Don't log full error if Python not found (expected on some systems)
      if (error.message.includes('ENOENT') || error.message.includes('command not found') || error.message.includes('Failed to start Python')) {
        logger.warn('⚠️ Sentence-BERT unavailable (Python not found). System will use fallback methods.');
      } else {
        logger.warn('⚠️ Sentence-BERT check failed:', error.message.substring(0, 100));
      }
      this.isAvailable = false;
    }
  }

  /**
   * Generate embedding vector for text
   * @param {string} text - Input text
   * @returns {Promise<number[]>} 768-dimensional embedding vector
   */
  async encode(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    if (!this.isAvailable) {
      throw new Error('Sentence-BERT not available');
    }

    try {
      const result = await this._runPython(['--encode', text]);
      
      if (!result.success || !result.embedding) {
        throw new Error('Failed to generate embedding');
      }

      return result.embedding; // Array of 768 floats
    } catch (error) {
      logger.warn('⚠️ Sentence-BERT encoding error:', error.message.substring(0, 100));
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * @param {string[]} texts - Array of input texts
   * @returns {Promise<number[][]>} Array of 768-dimensional vectors
   */
  async encodeBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Invalid texts input');
    }

    try {
      const result = await this._runPython(['--encode-batch', JSON.stringify(texts)]);
      
      if (!result.success || !result.embeddings) {
        throw new Error('Failed to generate batch embeddings');
      }

      return result.embeddings; // Array of arrays
    } catch (error) {
      logger.error('❌ Sentence-BERT batch encoding error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async similarity(text1, text2) {
    if (!text1 || !text2) {
      throw new Error('Both texts are required');
    }

    try {
      const result = await this._runPython(['--similarity', text1, text2]);
      
      if (!result.success || result.similarity === undefined) {
        throw new Error('Failed to calculate similarity');
      }

      return result.similarity; // Float 0-1
    } catch (error) {
      logger.error('❌ Sentence-BERT similarity error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate similarity between one text and multiple texts (batch)
   * @param {string} query - Query text
   * @param {string[]} documents - Array of document texts
   * @returns {Promise<number[]>} Array of similarity scores (0-1)
   */
  async similarityBatch(query, documents) {
    if (!query || !Array.isArray(documents) || documents.length === 0) {
      throw new Error('Invalid input: query and documents required');
    }

    try {
      const result = await this._runPython([
        '--similarity-batch', 
        query, 
        JSON.stringify(documents)
      ]);
      
      if (!result.success || !result.similarities) {
        throw new Error('Failed to calculate batch similarities');
      }

      return result.similarities; // Array of floats 0-1
    } catch (error) {
      logger.error('❌ Sentence-BERT batch similarity error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate similarity matrix for all pairs
   * @param {string[]} texts - Array of texts
   * @returns {Promise<number[][]>} NxN similarity matrix
   */
  async similarityMatrix(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Invalid texts input');
    }

    try {
      const result = await this._runPython([
        '--similarity-matrix', 
        JSON.stringify(texts)
      ]);
      
      if (!result.success || !result.matrix) {
        throw new Error('Failed to calculate similarity matrix');
      }

      return result.matrix; // NxN matrix
    } catch (error) {
      logger.error('❌ Sentence-BERT similarity matrix error:', error.message);
      throw error;
    }
  }

  /**
   * Execute Python script
   * @private
   */
  _runPython(args) {
    return new Promise((resolve, reject) => {
      // Try python3 first, then python
      // In Alpine Linux (Docker), python3 is available
      const pythonCmd = process.env.PYTHON_CMD || 'python3';
      const pythonProcess = spawn(pythonCmd, [this.pythonScript, ...args], {
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
      
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          // Don't log full error if it's just Python not found
          if (code === 127 || stderr.includes('command not found') || stderr.includes('ENOENT')) {
            logger.warn('⚠️ Python not found. Sentence-BERT will be unavailable.');
          } else {
            logger.error('Python script error:', stderr.substring(0, 200)); // Limit error length
          }
          return reject(new Error(stderr || `Python script exited with code ${code}`));
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout.substring(0, 200)}`));
        }
      });

      pythonProcess.on('error', (error) => {
        // Don't log full error if Python not found
        if (error.code === 'ENOENT') {
          logger.warn('⚠️ Python not found. Sentence-BERT will be unavailable.');
        } else {
          logger.error('❌ Python process error:', error.message);
        }
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Timeout after 30 seconds (model is pre-warmed)
      const timeoutId = setTimeout(() => {
        pythonProcess.kill('SIGKILL');
        logger.error('⏱️ Sentence-BERT timeout after 30s');
        reject(new Error('Sentence-BERT timeout (30s)'));
      }, 30000);
      
      pythonProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      available: this.isAvailable,
      modelName: this.modelName,
      embeddingDim: this.embeddingDim,
      scriptPath: this.pythonScript
    };
  }
}

// Singleton instance
let instance = null;

function getSentenceBertService() {
  if (!instance) {
    instance = new SentenceBertService();
  }
  return instance;
}

module.exports = {
  SentenceBertService,
  getSentenceBertService
};
