const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');

class PhoBERTService {
  constructor() {
    this.modelPath = path.join(__dirname, '../../models/phobert-cv-ner-final');
    this.pythonScript = path.join(__dirname, '../../python/phobert_inference.py');
    this.isModelAvailable = this.checkModelAvailability();
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
   * Extract skills from CV text using PhoBERT NER model
   * @param {string} text - CV text
   * @returns {Promise<string[]>} - Extracted skills
   */
  async extractSkills(text) {
    if (!this.isModelAvailable) {
      logger.warn('PhoBERT model not available, falling back to other methods');
      return [];
    }

    if (!text || typeof text !== 'string') {
      logger.error('Invalid text input for PhoBERT');
      return [];
    }

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.pythonScript, text]);

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
          logger.error(`PhoBERT inference failed: ${stderr}`);
          resolve([]); // Return empty array instead of rejecting
          return;
        }

        try {
          const result = JSON.parse(stdout);
          
          if (result.success && Array.isArray(result.skills)) {
            logger.info(`PhoBERT extracted ${result.skills.length} skills`);
            resolve(result.skills);
          } else {
            logger.error('Invalid PhoBERT response format');
            resolve([]);
          }
        } catch (error) {
          logger.error(`Failed to parse PhoBERT output: ${error.message}`);
          resolve([]);
        }
      });

      pythonProcess.on('error', (error) => {
        logger.error(`Failed to start PhoBERT process: ${error.message}`);
        resolve([]);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        pythonProcess.kill();
        logger.error('PhoBERT inference timeout');
        resolve([]);
      }, 30000);
    });
  }

  /**
   * Batch extract skills from multiple CV texts
   * @param {string[]} texts - Array of CV texts
   * @returns {Promise<string[][]>} - Array of extracted skills
   */
  async batchExtractSkills(texts) {
    if (!Array.isArray(texts)) {
      return [];
    }

    const results = await Promise.all(
      texts.map(text => this.extractSkills(text))
    );

    return results;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      available: this.isModelAvailable,
      modelPath: this.modelPath,
      type: 'PhoBERT-base fine-tuned for NER',
      labels: ['O', 'B-SKILL', 'I-SKILL']
    };
  }
}

module.exports = new PhoBERTService();
