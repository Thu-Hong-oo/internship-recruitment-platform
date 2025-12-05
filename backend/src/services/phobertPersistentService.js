const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Persistent PhoBERT Service
 * Keeps Python process running with model loaded in memory
 * Much faster than loading model for each request
 */
class PhoBERTPersistentService {
  constructor() {
    this.modelPath = path.join(__dirname, '../../models/phobert-cv-ner-final');
    this.pythonScript = path.join(__dirname, '../../python/phobert_server.py');
    this.pythonProcess = null;
    this.isReady = false;
    this.isModelAvailable = this.checkModelAvailability();
    this.requestQueue = [];
    this.pendingRequests = new Map();
    this.requestId = 0;

    if (this.isModelAvailable) {
      this.startPersistentProcess();
    }
  }

  /**
   * Check if PhoBERT model is available
   */
  checkModelAvailability() {
    const fs = require('fs');
    const modelConfigPath = path.join(this.modelPath, 'config.json');
    return fs.existsSync(modelConfigPath);
  }

  /**
   * Start persistent Python process
   */
  startPersistentProcess() {
    if (this.pythonProcess) {
      logger.warn('PhoBERT process already running');
      return;
    }

    logger.info('🚀 Starting persistent PhoBERT server...');

    try {
      this.pythonProcess = spawn('python', [this.pythonScript]);

      let buffer = '';

      this.pythonProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        lines.forEach(line => {
          if (!line.trim()) return;

          try {
            const response = JSON.parse(line);

            // Handle status messages
            if (response.status) {
              if (response.status === 'loading_model') {
                logger.info('📦 Loading PhoBERT model...');
              } else if (response.status === 'model_loaded') {
                logger.info('✅ PhoBERT model loaded successfully');
              } else if (response.status === 'ready') {
                this.isReady = true;
                logger.info('✅ PhoBERT server ready to accept requests');
              }
            }
            // Handle skill extraction responses
            else if (response.success !== undefined) {
              // Find corresponding pending request
              const request = this.pendingRequests.get(this.currentRequestId);
              if (request) {
                this.pendingRequests.delete(this.currentRequestId);
                clearTimeout(request.timeout);
                request.resolve(response.skills || []);
              }
            }
          } catch (error) {
            logger.error('Failed to parse PhoBERT response:', error.message);
          }
        });
      });

      this.pythonProcess.stderr.on('data', (data) => {
        logger.error('PhoBERT stderr:', data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        logger.warn(`PhoBERT process exited with code ${code}`);
        this.isReady = false;
        this.pythonProcess = null;

        // Reject all pending requests
        this.pendingRequests.forEach(request => {
          clearTimeout(request.timeout);
          request.reject(new Error('PhoBERT process died'));
        });
        this.pendingRequests.clear();

        // Auto-restart after 2 seconds
        if (this.isModelAvailable) {
          setTimeout(() => {
            logger.info('♻️ Auto-restarting PhoBERT server...');
            this.startPersistentProcess();
          }, 2000);
        }
      });

      this.pythonProcess.on('error', (error) => {
        logger.error('Failed to start PhoBERT process:', error.message);
        this.isReady = false;
      });

    } catch (error) {
      logger.error('Error starting persistent PhoBERT:', error.message);
      this.isReady = false;
    }
  }

  /**
   * Extract skills from CV text using persistent PhoBERT process
   * @param {string} text - CV text
   * @param {Object} options - Extraction options
   * @returns {Promise<string[]>} - Extracted skills
   */
  async extractSkills(text, options = {}) {
    if (!this.isModelAvailable) {
      logger.warn('PhoBERT model not available');
      return [];
    }

    if (!this.isReady) {
      logger.warn('PhoBERT server not ready yet, waiting...');
      // Wait up to 30 seconds for server to be ready
      await this.waitForReady(30000);
      if (!this.isReady) {
        logger.error('PhoBERT server failed to start');
        return [];
      }
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return [];
    }

    const {
      maxLength = 500,
      timeout = 10000 // 10 seconds timeout for extraction
    } = options;

    // Truncate text if too long
    const truncatedText = text.substring(0, maxLength);

    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      this.currentRequestId = requestId;

      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        logger.warn(`⏱️ PhoBERT request ${requestId} timeout`);
        resolve([]); // Return empty array on timeout
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutId
      });

      // Send request to Python server
      const request = {
        text: truncatedText
      };

      try {
        this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        logger.error('Failed to send request to PhoBERT:', error.message);
        resolve([]);
      }
    });
  }

  /**
   * Wait for PhoBERT server to be ready
   * @param {number} maxWaitTime - Maximum wait time in milliseconds
   */
  async waitForReady(maxWaitTime = 30000) {
    const startTime = Date.now();
    while (!this.isReady && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Stop persistent process
   */
  stop() {
    if (this.pythonProcess) {
      logger.info('🛑 Stopping PhoBERT server...');
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
      this.isReady = false;
    }
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      available: this.isModelAvailable,
      ready: this.isReady,
      modelPath: this.modelPath,
      type: 'PhoBERT-base fine-tuned for NER (Persistent)',
      labels: ['O', 'B-SKILL', 'I-SKILL']
    };
  }
}

// Singleton instance
let instance = null;

function getPhoBERTPersistentService() {
  if (!instance) {
    instance = new PhoBERTPersistentService();
  }
  return instance;
}

module.exports = {
  PhoBERTPersistentService,
  getPhoBERTPersistentService
};
