/**
 * 🤖 Dialogflow Service (CX + optional ES)
 *
 * - Default: CX (projectLocationAgentSessionPath)
 * - Optional: ES (projectAgentSessionPath) when DIALOGFLOW_MODE=ES
 * - Fallback: rule-based handled in dialogflowIntentService
 */

let SessionsClientCX;
let SessionsClientES;
try {
  SessionsClientCX = require('@google-cloud/dialogflow-cx').SessionsClient;
} catch (error) {
  SessionsClientCX = null;
}
try {
  // Dialogflow ES SDK (lightweight)
  SessionsClientES = require('@google-cloud/dialogflow').SessionsClient;
} catch (error) {
  SessionsClientES = null;
}

const { logger } = require('../../utils/logger');
const { normalizeVietnameseText } = require('../../utils/textUtils');

class DialogflowService {
  constructor() {
    // Clean và normalize env variables (loại bỏ dấu = thừa, trim spaces)
    const cleanEnv = value => {
      if (!value) return value;
      return String(value).trim().replace(/^=+/, ''); // Loại bỏ dấu = ở đầu
    };

    this.projectId = cleanEnv(process.env.DIALOGFLOW_PROJECT_ID);
    this.location = cleanEnv(process.env.DIALOGFLOW_LOCATION) || 'global';
    this.agentId = cleanEnv(process.env.DIALOGFLOW_AGENT_ID);
    this.languageCode = cleanEnv(process.env.DIALOGFLOW_LANGUAGE_CODE) || 'vi';
    this.mode = (cleanEnv(process.env.DIALOGFLOW_MODE) || 'CX').toUpperCase(); // CX | ES

    // Initialize Dialogflow client
    this.client = null;
    this.isInitialized = false;
    this.isES = false;

    // Cache for intent recognition (reduce API calls)
    this.intentCache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    this._initialize();
  }

  /**
   * Initialize Dialogflow client
   */
  _initialize() {
    try {
      // Basic console log to ensure this path runs even if logger level filters out
      console.log(`[DialogflowService] init start - mode=${this.mode}`);
      logger.info(`ℹ️ Dialogflow mode: ${this.mode}`);
      // Mode selection
      if (this.mode === 'ES') {
        if (!SessionsClientES) {
          logger.warn(
            '⚠️ Dialogflow ES package not installed. Run: npm install @google-cloud/dialogflow'
          );
          return;
        }
        if (!this.projectId) {
          logger.warn(
            '⚠️ Dialogflow ES not configured: DIALOGFLOW_PROJECT_ID missing'
          );
          logger.info(
            'ℹ️ System will use rule-based fallback for intent recognition'
          );
          return;
        }
        this.client = process.env.GOOGLE_APPLICATION_CREDENTIALS
          ? new SessionsClientES({
              keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            })
          : new SessionsClientES();
        this.isES = true;
        this.isInitialized = true;
        logger.info('✅ Dialogflow ES client initialized');
        logger.info(`   Project: ${this.projectId}, Mode: ES`);
        return;
      }

      // Default: CX
      if (!SessionsClientCX) {
        logger.warn(
          '⚠️ Dialogflow CX package not installed. Run: npm install @google-cloud/dialogflow-cx'
        );
        return;
      }
      if (!this.projectId || !this.agentId) {
        logger.warn(
          '⚠️ Dialogflow CX not configured: DIALOGFLOW_PROJECT_ID or DIALOGFLOW_AGENT_ID missing'
        );
        logger.info(
          'ℹ️ System will use rule-based fallback for intent recognition'
        );
        return;
      }
      this.client = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? new SessionsClientCX({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          })
        : new SessionsClientCX();
      this.isInitialized = true;
      logger.info('✅ Dialogflow CX client initialized');
      logger.info(
        `   Project: ${this.projectId}, Location: ${this.location}, Agent: ${this.agentId}, Mode: CX`
      );
    } catch (error) {
      logger.error('❌ Failed to initialize Dialogflow client:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Detect intent từ user input
   * @param {string} text - User input text
   * @param {string} sessionId - Session ID (default: 'default-session')
   * @returns {Promise<Object>} Intent recognition result
   */
  async detectIntent(text, sessionId = 'default-session') {
    if (!this.isInitialized || !this.client) {
      logger.warn(
        '⚠️ Dialogflow not initialized or client missing. Falling back.'
      );
      throw new Error(
        'Dialogflow client not initialized. Please check configuration.'
      );
    }

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Input text is required',
      };
    }

    // Check cache
    const cacheKey = `${sessionId}:${normalizeVietnameseText(text)}`;
    const cached = this.intentCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug('🎯 Dialogflow cache hit:', cacheKey);
      return cached.result;
    }

    try {
      // Build session path + request per mode
      const sessionPath = this.isES
        ? this.client.projectAgentSessionPath(this.projectId, sessionId)
        : this.client.projectLocationAgentSessionPath(
            this.projectId,
            this.location,
            this.agentId,
            sessionId
          );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: text,
            languageCode: this.languageCode,
          },
        },
      };

      // Call Dialogflow API
      const [response] = await this.client.detectIntent(request);
      const queryResult =
        response.queryResult || response[0]?.queryResult || {};

      // Extract intent and parameters
      const intent = queryResult.intent?.displayName || null;
      const confidence = queryResult.intentDetectionConfidence || 0;
      const parameters = this._extractParameters(queryResult.parameters);

      // Build result
      const result = {
        success: true,
        intent: intent,
        confidence: confidence,
        parameters: parameters,
        fulfillmentText: queryResult.fulfillmentText || null,
        languageCode: queryResult.languageCode || this.languageCode,
        rawResponse: queryResult,
      };

      // Cache result
      this.intentCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      logger.debug(
        `✅ Dialogflow intent detected: ${intent} (confidence: ${confidence}, mode: ${
          this.isES ? 'ES' : 'CX'
        })`
      );

      return result;
    } catch (error) {
      logger.error('❌ Dialogflow API error:', error);
      return {
        success: false,
        error: error.message || 'Dialogflow API error',
        details: error,
      };
    }
  }

  /**
   * Extract parameters từ Dialogflow response
   * @param {Object} parameters - Dialogflow parameters object
   * @returns {Object} Normalized parameters
   */
  _extractParameters(parameters) {
    if (!parameters || !parameters.fields) {
      return {};
    }

    const extracted = {};

    // Dialogflow returns parameters as { fields: { key: { stringValue: 'value' } } }
    Object.entries(parameters.fields).forEach(([key, value]) => {
      // Handle different value types
      if (value.stringValue) {
        extracted[key] = value.stringValue;
      } else if (value.numberValue !== undefined) {
        extracted[key] = value.numberValue;
      } else if (value.boolValue !== undefined) {
        extracted[key] = value.boolValue;
      } else if (value.listValue) {
        // Handle array values
        extracted[key] = value.listValue.values.map(
          v => v.stringValue || v.numberValue || v.boolValue
        );
      } else if (value.structValue) {
        // Handle nested objects
        extracted[key] = this._extractParameters(value.structValue);
      }
    });

    return extracted;
  }

  /**
   * Clear intent cache
   */
  clearCache() {
    this.intentCache.clear();
    logger.info('🗑️ Dialogflow intent cache cleared');
  }

  /**
   * Check if Dialogflow is available
   */
  isAvailable() {
    return this.isInitialized && this.client !== null;
  }
}

module.exports = new DialogflowService();
