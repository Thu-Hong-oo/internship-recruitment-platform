const translationService = require('../services/translationService');
const { ApiResponse } = require('../utils/responseHandler');

class TranslationController {
  constructor() {
    this.translateText = this.translateText.bind(this);
    this.MAX_CHARS = 6000;
  }

  async translateText(req, res) {
    try {
      const {
        text,
        targetLang,
        sourceLang = 'auto',
        format = 'text',
      } = req.body || {};

      if (!text || typeof text !== 'string') {
        return ApiResponse.error(res, 'Field "text" is required', 400);
      }

      if (!targetLang || typeof targetLang !== 'string') {
        return ApiResponse.error(res, 'Field "targetLang" is required', 400);
      }

      if (text.length > this.MAX_CHARS) {
        return ApiResponse.error(
          res,
          `Text exceeds ${this.MAX_CHARS} characters`,
          413
        );
      }

      const translation = await translationService.translateText({
        text: text.trim(),
        targetLang: targetLang.trim(),
        sourceLang: sourceLang?.trim() || 'auto',
        format,
      });

      return ApiResponse.success(
        res,
        translation,
        'Text translated successfully'
      );
    } catch (error) {
      return ApiResponse.error(
        res,
        error.message || 'Translation failed',
        502
      );
    }
  }
}

module.exports = new TranslationController();













































