const axios = require('axios');
const { logger } = require('../utils/logger');

class TranslationService {
  constructor() {
    this.baseUrl =
      process.env.TRANSLATE_BASE_URL?.trim() ||
      'http://localhost:5000/translate';
    this.timeoutMs = parseInt(process.env.TRANSLATE_TIMEOUT_MS || '10000', 10);
  }

  /**
   * Translate text using LibreTranslate-compatible API
   * @param {Object} params
   * @param {string} params.text
   * @param {string} params.sourceLang
   * @param {string} params.targetLang
   * @param {string} params.format
   */
  async translateText({
    text,
    sourceLang = 'auto',
    targetLang = 'en',
    format = 'text',
  }) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text to translate is required');
    }
    if (!targetLang) {
      throw new Error('Target language is required');
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          q: text,
          source: sourceLang,
          target: targetLang,
          format,
        },
        {
          timeout: this.timeoutMs,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const translatedText =
        response.data?.translatedText || response.data?.translated_text;

      if (!translatedText) {
        throw new Error('Translation service returned empty result');
      }

      return {
        originalText: text,
        translatedText,
        sourceLang:
          response.data?.detectedLanguage ||
          response.data?.detected_language ||
          sourceLang,
        targetLang,
        provider: 'libretranslate',
        metadata: {
          charCount: text.length,
        },
      };
    } catch (error) {
      const status = error.response?.status;
      const serviceMessage = error.response?.data?.error;
      const message = serviceMessage || error.message || 'Translation failed';

      logger.error('Translation service error', {
        status,
        message,
      });

      throw new Error(`Translation failed: ${message}`);
    }
  }
}

module.exports = new TranslationService();











