const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Multilingual NER Service
 * Using dslim/bert-base-NER-uncased for entity extraction
 * Supports English + Vietnamese (multilingual understanding)
 *
 * Better than PhoBERT for:
 * - Mixed language CVs (English + Vietnamese)
 * - English-only CVs
 * - General entity recognition (not just skills)
 */
class MultilingualNERService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../python/multilingual_ner_server.py');
    this.pythonProcess = null;
    this.isReady = false;
    this.pendingRequests = new Map();
    this.requestId = 0;

    // Start persistent process immediately
    this.startPersistentProcess();
  }

  /**
   * Start persistent Python process
   */
  startPersistentProcess() {
    if (this.pythonProcess) {
      logger.warn('Multilingual NER process already running');
      return;
    }

    logger.info('🚀 Starting Multilingual NER server (dslim/bert-base-NER)...');

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
                logger.info('📦 Loading Multilingual NER model...');
              } else if (response.status === 'downloading_model') {
                logger.info(`📥 Downloading model: ${response.model}...`);
              } else if (response.status === 'model_saved') {
                logger.info(`💾 Model saved to: ${response.path}`);
              } else if (response.status === 'model_loaded') {
                logger.info(`✅ Multilingual NER model loaded (device: ${response.device})`);
              } else if (response.status === 'ready') {
                this.isReady = true;
                logger.info('✅ Multilingual NER server ready');
              }
            }
            // Handle extraction responses
            else if (response.success !== undefined) {
              const request = this.pendingRequests.get(this.currentRequestId);
              if (request) {
                this.pendingRequests.delete(this.currentRequestId);
                clearTimeout(request.timeout);
                request.resolve(response.entities || []);
              }
            }
          } catch (error) {
            logger.error('Failed to parse Multilingual NER response:', error.message);
          }
        });
      });

      this.pythonProcess.stderr.on('data', (data) => {
        logger.error('Multilingual NER stderr:', data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        logger.warn(`Multilingual NER process exited with code ${code}`);
        this.isReady = false;
        this.pythonProcess = null;

        // Reject all pending requests
        this.pendingRequests.forEach(request => {
          clearTimeout(request.timeout);
          request.reject(new Error('Multilingual NER process died'));
        });
        this.pendingRequests.clear();

        // Auto-restart after 2 seconds
        setTimeout(() => {
          logger.info('♻️ Auto-restarting Multilingual NER server...');
          this.startPersistentProcess();
        }, 2000);
      });

      this.pythonProcess.on('error', (error) => {
        logger.error('Failed to start Multilingual NER process:', error.message);
        this.isReady = false;
      });

    } catch (error) {
      logger.error('Error starting Multilingual NER:', error.message);
      this.isReady = false;
    }
  }

  /**
   * Extract entities from text using Multilingual NER
   * @param {string} text - Input text
   * @param {Object} options - Extraction options
   * @returns {Promise<Array>} - Extracted entities
   */
  async extractEntities(text, options = {}) {
    if (!this.isReady) {
      logger.warn('Multilingual NER server not ready yet, waiting...');
      await this.waitForReady(60000); // Wait up to 60s (model download may take time)
      if (!this.isReady) {
        logger.error('Multilingual NER server failed to start');
        return [];
      }
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return [];
    }

    const {
      maxLength = 512,
      minScore = 0.5,
      timeout = 15000 // 15 seconds timeout
    } = options;

    // Truncate text if too long
    const truncatedText = text.substring(0, maxLength);

    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      this.currentRequestId = requestId;

      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        logger.warn(`⏱️ Multilingual NER request ${requestId} timeout`);
        resolve([]); // Return empty array on timeout
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve: (entities) => {
          // Filter by minimum score
          const filtered = entities.filter(e => e.score >= minScore);
          resolve(filtered);
        },
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
        logger.error('Failed to send request to Multilingual NER:', error.message);
        resolve([]);
      }
    });
  }

  /**
   * Extract skills specifically (filter entity types)
   * @param {string} text - Input text
   * @param {Object} options - Extraction options
   * @returns {Promise<Array>} - Extracted skills
   */
  async extractSkills(text, options = {}) {
    const entities = await this.extractEntities(text, options);

    // For multilingual NER, we get entities like PER, ORG, LOC, MISC
    // We'll keep MISC and ORG as potential skills
    // Filter out PER (person names) and LOC (locations)
    const skills = entities
      .filter(entity => {
        const type = entity.type.toUpperCase();
        // Keep MISC (miscellaneous) and ORG (organizations/technologies)
        return type === 'MISC' || type === 'ORG';
      })
      .map(entity => ({
        name: entity.text,
        type: 'technical',
        confidence: entity.score,
        source: 'multilingual-ner'
      }));

    return skills;
  }

  /**
   * Wait for server to be ready
   * @param {number} maxWaitTime - Maximum wait time in milliseconds
   */
  async waitForReady(maxWaitTime = 60000) {
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
      logger.info('🛑 Stopping Multilingual NER server...');
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
      ready: this.isReady,
      model: 'dslim/bert-base-NER-uncased',
      type: 'Multilingual NER (Persistent)',
      supports: ['English', 'Vietnamese (partial)', 'Mixed language'],
      entityTypes: ['PER', 'ORG', 'LOC', 'MISC']
    };
  }
}

// Singleton instance
let instance = null;

function getMultilingualNERService() {
  if (!instance) {
    instance = new MultilingualNERService();
  }
  return instance;
}

module.exports = {
  MultilingualNERService,
  getMultilingualNERService
};
