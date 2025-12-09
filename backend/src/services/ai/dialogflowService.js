/**
 * 🤖 Dialogflow CX Service
 * 
 * Service để tích hợp với Google Dialogflow CX cho intent recognition
 * Hỗ trợ tiếng Việt tự nhiên và điều hướng web
 */

let SessionsClient;
try {
  SessionsClient = require('@google-cloud/dialogflow-cx').SessionsClient;
} catch (error) {
  // Package chưa được cài đặt hoặc có lỗi
  SessionsClient = null;
}

const { logger } = require('../../utils/logger');
const { normalizeVietnameseText } = require('../../utils/textUtils');

class DialogflowService {
  constructor() {
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID;
    this.location = process.env.DIALOGFLOW_LOCATION || 'global';
    this.agentId = process.env.DIALOGFLOW_AGENT_ID;
    this.languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || 'vi';
    
    // Initialize Dialogflow client
    this.client = null;
    this.isInitialized = false;
    
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
      // Check if Dialogflow package is available
      if (!SessionsClient) {
        logger.warn('⚠️ Dialogflow package not installed. Run: npm install @google-cloud/dialogflow-cx');
        return;
      }
      
      // Check if Dialogflow is configured
      if (!this.projectId || !this.agentId) {
        logger.warn('⚠️ Dialogflow not configured: DIALOGFLOW_PROJECT_ID or DIALOGFLOW_AGENT_ID missing');
        logger.info('ℹ️ System will use rule-based fallback for intent recognition');
        return;
      }
      
      // Initialize client with credentials
      // Option 1: Use service account key file
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new SessionsClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
      } 
      // Option 2: Use default credentials (for Cloud Run, GCE, etc.)
      else {
        this.client = new SessionsClient();
      }
      
      this.isInitialized = true;
      logger.info('✅ Dialogflow CX client initialized');
      logger.info(`   Project: ${this.projectId}, Location: ${this.location}, Agent: ${this.agentId}`);
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
      throw new Error('Dialogflow client not initialized. Please check configuration.');
    }
    
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Input text is required'
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
      // Build session path
      const sessionPath = this.client.projectLocationAgentSessionPath(
        this.projectId,
        this.location,
        this.agentId,
        sessionId
      );
      
      // Create request
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: text,
            languageCode: this.languageCode
          }
        }
      };
      
      // Call Dialogflow API
      const [response] = await this.client.detectIntent(request);
      const queryResult = response.queryResult;
      
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
        rawResponse: queryResult
      };
      
      // Cache result
      this.intentCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      logger.debug(`✅ Dialogflow intent detected: ${intent} (confidence: ${confidence})`);
      
      return result;
    } catch (error) {
      logger.error('❌ Dialogflow API error:', error);
      return {
        success: false,
        error: error.message || 'Dialogflow API error',
        details: error
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
        extracted[key] = value.listValue.values.map(v => 
          v.stringValue || v.numberValue || v.boolValue
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

