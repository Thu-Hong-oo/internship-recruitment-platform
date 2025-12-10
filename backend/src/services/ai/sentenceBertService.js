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
      // Check if Python script exists first
      const fs = require('fs');
      if (!fs.existsSync(this.pythonScript)) {
        logger.warn(`⚠️ Sentence-BERT script not found: ${this.pythonScript}`);
        this.isAvailable = false;
        return;
      }

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
      // Check if Python script exists
      const fs = require('fs');
      if (!fs.existsSync(this.pythonScript)) {
        logger.error(`❌ Python script not found: ${this.pythonScript}`);
        return reject(new Error(`Python script not found: ${this.pythonScript}`));
      }

      // Detect Python command based on OS
      // Windows: try 'python' or 'py', Linux/Mac: try 'python3' then 'python'
      let pythonCmd = process.env.PYTHON_CMD;
      if (!pythonCmd) {
        if (process.platform === 'win32') {
          // Windows: try 'python' first, then 'py' launcher
          pythonCmd = 'python';
        } else {
          // Linux/Mac: try 'python3' first
          pythonCmd = 'python3';
        }
      }
      
      logger.debug(`🔍 Running: ${pythonCmd} ${this.pythonScript} ${args.join(' ')}`);
      
      const pythonProcess = spawn(pythonCmd, [this.pythonScript, ...args], {
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
        shell: process.platform === 'win32' // Use shell on Windows for better command resolution
      });
      
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Timeout after 30 seconds (model is pre-warmed)
      const timeoutId = setTimeout(() => {
        pythonProcess.kill('SIGKILL');
        logger.error('⏱️ Sentence-BERT timeout after 30s');
        reject(new Error('Sentence-BERT timeout (30s)'));
      }, 30000);

      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code !== 0) {
          // Windows exit code 9009 = command not found
          // Linux/Mac exit code 127 = command not found
          const isCommandNotFound = code === 127 || code === 9009 || 
            stderr.includes('command not found') || 
            stderr.includes('ENOENT') ||
            stderr.includes('is not recognized') ||
            stderr.includes('cannot find');
            
          if (isCommandNotFound) {
            logger.warn(`⚠️ Python not found (code ${code}, command: ${pythonCmd}). Sentence-BERT will be unavailable.`);
            if (process.platform === 'win32' && pythonCmd === 'python') {
              logger.info(`💡 Tip: Try installing Python or use 'py' launcher. Set PYTHON_CMD environment variable if Python is installed.`);
            }
          } else {
            // Log more details for debugging
            const errorMsg = stderr || stdout || `Python script exited with code ${code}`;
            logger.error(`❌ Python script error (code ${code}):`, errorMsg.substring(0, 500));
            logger.error(`   Command: ${pythonCmd} ${this.pythonScript} ${args.join(' ')}`);
            logger.error(`   Script path: ${this.pythonScript}`);
            logger.error(`   Script exists: ${fs.existsSync(this.pythonScript)}`);
            if (stdout) logger.error(`   stdout: ${stdout.substring(0, 200)}`);
          }
          return reject(new Error(stderr || stdout || `Python script exited with code ${code}`));
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          logger.error(`❌ Failed to parse Python output. stdout: ${stdout.substring(0, 200)}`);
          logger.error(`   stderr: ${stderr.substring(0, 200)}`);
          reject(new Error(`Failed to parse Python output: ${stdout.substring(0, 200)}`));
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        // Don't log full error if Python not found
        if (error.code === 'ENOENT') {
          logger.warn(`⚠️ Python not found (${pythonCmd}). Sentence-BERT will be unavailable.`);
        } else {
          logger.error(`❌ Python process error: ${error.message}`);
          logger.error(`   Command: ${pythonCmd}`);
          logger.error(`   Script: ${this.pythonScript}`);
        }
        reject(new Error(`Failed to start Python process: ${error.message}`));
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
