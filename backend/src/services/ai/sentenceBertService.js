/**
 * 🧠 Sentence-BERT Embedding Service
 * 
 * SELF-SUFFICIENT NLP service for:
 * - Text embedding generation (multilingual)
 * - Semantic similarity calculation
 * - CV-Job matching
 * 
 * Model: bkai-foundation-models/vietnamese-bi-encoder (lighter, VN-optimized)
 * Source: bkai-foundation-models/vietnamese-bi-encoder
 * 
 * NO external API dependency - runs locally with Python
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const { logger } = require('../../utils/logger');

class SentenceBertService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../../python/sentence_bert_inference.py');
    this.modelServerScript = path.join(__dirname, '../../../python/model_server.py');
    this.modelName = 'bkai-foundation-models/vietnamese-bi-encoder';
    this.embeddingDim = 768;
    this.isAvailable = false;
    this.modelProcess = null;
    this.modelReadyPromise = null;
    this.pendingRequests = new Map(); // id -> {resolve,reject,timeoutId}
    this.nextRequestId = 1;
    this.stdoutBuffer = '';
    
    // Check if model is available (non-blocking, reduced load)
    this._checkAvailability();
  }

  /**
   * Check if Sentence-BERT model is available
   */
  async _checkAvailability() {
    // Use persistent model server as availability check to avoid spawning per call
    try {
      await this._ensureModelServer(parseInt(process.env.SENTENCE_BERT_CHECK_TIMEOUT_MS || '180000', 10));
      this.isAvailable = true;
      logger.info(`✅ Sentence-BERT model available (server ready): ${this.modelName}`);
    } catch (error) {
      logger.warn(`⚠️ Sentence-BERT check failed: ${error.message}`);
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

    // Ensure availability (lazy re-check)
    if (!this.isAvailable) {
      await this._checkAvailability();
    }
    if (!this.isAvailable) {
      throw new Error('Sentence-BERT not available');
    }

    // Use batch path to avoid shell argument parsing issues with long text
    const embeddings = await this.encodeBatch([text]);
    return embeddings[0];
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
      const result = await this._sendToModelServer({
        action: 'encode_batch',
        texts
      });
      
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
      const result = await this._sendToModelServer({
        action: 'similarity',
        text1,
        text2
      });
      
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
      const result = await this._sendToModelServer({
        action: 'similarity_batch',
        query,
        docs: documents
      });
      
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
      const result = await this._sendToModelServer({
        action: 'similarity_matrix',
        texts
      });
      
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
   * Persistent model server (stdin/stdout) to avoid spawning Python per job
   */
  _ensureModelServer(timeoutMs = 120000) {
    if (this.modelReadyPromise) {
      return this.modelReadyPromise;
    }

    this.modelReadyPromise = new Promise((resolve, reject) => {
      const fs = require('fs');
      if (!fs.existsSync(this.modelServerScript)) {
        logger.error(`❌ Model server script not found: ${this.modelServerScript}`);
        this.modelReadyPromise = null;
        return reject(new Error('Model server script missing'));
      }

      const pythonCmd = this._resolvePythonCmd();
      logger.info(`🚀 Starting SBERT model server: ${pythonCmd} ${this.modelServerScript}`);

      this.modelProcess = spawn(pythonCmd, [this.modelServerScript], {
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
        shell: process.platform === 'win32'
      });

      // Handle stdout lines
      this.modelProcess.stdout.on('data', (data) => {
        this.stdoutBuffer += data.toString();
        const lines = this.stdoutBuffer.split('\n');
        this.stdoutBuffer = lines.pop(); // keep tail
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'MODEL_READY') {
            logger.info('✅ SBERT model server ready (persistent process)');
            this.isAvailable = true;
            resolve(true);
            continue;
          }
          try {
            const resp = JSON.parse(trimmed);
            const pending = this.pendingRequests.get(resp.id);
            if (pending) {
              clearTimeout(pending.timeoutId);
              this.pendingRequests.delete(resp.id);
              pending.resolve(resp);
            } else {
              logger.warn(`⚠️ Received response for unknown request id=${resp.id}`);
            }
          } catch (err) {
            logger.error('❌ Failed to parse model server output:', err.message);
          }
        }
      });

      this.modelProcess.stderr.on('data', (data) => {
        const msg = data.toString();
        // Only log first 500 chars to avoid noise
        logger.warn(`⚠️ Model server stderr: ${msg.substring(0, 500)}`);
      });

      this.modelProcess.on('close', (code) => {
        logger.error(`❌ Model server exited with code ${code}`);
        this.isAvailable = false;
        this.modelReadyPromise = null;
        // reject all pending
        for (const [, pending] of this.pendingRequests.entries()) {
          clearTimeout(pending.timeoutId);
          pending.reject(new Error(`Model server exited with code ${code}`));
        }
        this.pendingRequests.clear();
        reject(new Error(`Model server exited with code ${code}`));
      });

      this.modelProcess.on('error', (err) => {
        logger.error(`❌ Failed to start model server: ${err.message}`);
        this.isAvailable = false;
        this.modelReadyPromise = null;
        reject(err);
      });

      // Safety timeout for ready
      setTimeout(() => {
        if (!this.isAvailable) {
          logger.error('⏱️ Model server startup timeout');
          this.modelReadyPromise = null;
          reject(new Error('Model server startup timeout'));
        }
      }, timeoutMs);
    });

    return this.modelReadyPromise;
  }

  _sendToModelServer(payload, timeoutMs = 60000) {
    return new Promise(async (resolve, reject) => {
      try {
        await this._ensureModelServer();
      } catch (err) {
        return reject(err);
      }

      const id = this.nextRequestId++;
      const message = { id, ...payload };
      const jsonLine = JSON.stringify(message) + '\n';

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Model server timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      const ok = this.modelProcess.stdin.write(jsonLine);
      if (!ok) {
        this.modelProcess.stdin.once('drain', () => {});
      }
    });
  }

  /**
   * Execute Python script
   * @private
   */
  _resolvePythonCmd() {
    const fs = require('fs');
    const envCmd = process.env.PYTHON_CMD;
    const candidates = envCmd
      ? [envCmd]
      : process.platform === 'win32'
        ? ['python', 'py', 'py -3']
        : ['python3', 'python'];

    for (const cmd of candidates) {
      try {
        const result = spawnSync(cmd, ['--version'], {
          shell: process.platform === 'win32',
          env: { ...process.env, PYTHONUNBUFFERED: '1' },
          stdio: 'pipe',
          timeout: 5000,
        });
        if (result.status === 0 || result.error === undefined) {
          return cmd;
        }
      } catch (_) {
        // continue to next candidate
      }
    }

    return candidates[candidates.length - 1];
  }

  _runPython(args, timeoutMs = 90000) {
    return new Promise((resolve, reject) => {
      // Check if Python script exists
      const fs = require('fs');
      if (!fs.existsSync(this.pythonScript)) {
        logger.error(`❌ Python script not found: ${this.pythonScript}`);
        return reject(new Error(`Python script not found: ${this.pythonScript}`));
      }

      // Resolve Python command with fallbacks (python -> py -> py -3)
      const pythonCmd = this._resolvePythonCmd();
      
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

      // Timeout guard
      const timeoutId = setTimeout(() => {
        pythonProcess.kill('SIGKILL');
        logger.error(`⏱️ Sentence-BERT timeout after ${timeoutMs / 1000}s`);
        reject(new Error(`Sentence-BERT timeout (${timeoutMs / 1000}s)`));
      }, timeoutMs);

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
            logger.error(`❌ Python script error (code ${code}):`, errorMsg.substring(0, 1000));
            logger.error(`   Command: ${pythonCmd} ${this.pythonScript} ${args.join(' ')}`);
            logger.error(`   Script path: ${this.pythonScript}`);
            logger.error(`   Script exists: ${fs.existsSync(this.pythonScript)}`);
            if (stdout) logger.error(`   stdout (first 500 chars): ${stdout.substring(0, 500)}`);
            if (stderr) logger.error(`   stderr (first 500 chars): ${stderr.substring(0, 500)}`);
          }
          return reject(new Error(stderr || stdout || `Python script exited with code ${code}`));
        }

        try {
          // Python script outputs JSON, try to parse it
          const result = JSON.parse(stdout);
          
          // Check if Python script returned an error in JSON format
          if (result.success === false) {
            logger.error(`❌ Python script returned error: ${result.error || 'Unknown error'}`);
            logger.error(`   Error type: ${result.type || 'Unknown'}`);
            return reject(new Error(result.error || 'Python script failed'));
          }
          
          resolve(result);
        } catch (error) {
          // If stdout is not JSON, log both stdout and stderr for debugging
          logger.error(`❌ Failed to parse Python output as JSON`);
          logger.error(`   stdout (first 500 chars): ${stdout.substring(0, 500)}`);
          logger.error(`   stderr (first 500 chars): ${stderr.substring(0, 500)}`);
          logger.error(`   Parse error: ${error.message}`);
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
