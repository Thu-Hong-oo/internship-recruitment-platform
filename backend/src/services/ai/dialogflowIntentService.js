/**
 * 🎯 Dialogflow Intent Recognition Service
 *
 * Service chính để nhận diện intent từ user input sử dụng Dialogflow
 * Kết hợp với location normalization và navigation mapping
 */

const dialogflowService = require('./dialogflowService');
const { logger } = require('../../utils/logger');
const { normalizeVietnameseText } = require('../../utils/textUtils');

class DialogflowIntentService {
  constructor() {
    // Location normalization map (tận dụng từ codebase hiện có)
    this.locationMap = {
      // Ho Chi Minh City
      'ho chi minh': 'Ho Chi Minh',
      'hồ chí minh': 'Ho Chi Minh',
      'sài gòn': 'Ho Chi Minh',
      'sai gon': 'Ho Chi Minh',
      saigon: 'Ho Chi Minh',
      tphcm: 'Ho Chi Minh',
      'tp.hcm': 'Ho Chi Minh',
      'tp hcm': 'Ho Chi Minh',
      hcm: 'Ho Chi Minh',
      'thành phố hồ chí minh': 'Ho Chi Minh',
      'tp. hồ chí minh': 'Ho Chi Minh',
      'tp hồ chí minh': 'Ho Chi Minh',

      // Ha Noi
      'ha noi': 'Ha Noi',
      'hà nội': 'Ha Noi',
      hanoi: 'Ha Noi',
      hn: 'Ha Noi',
      'thủ đô': 'Ha Noi',
      'thu do': 'Ha Noi',
      'thành phố hà nội': 'Ha Noi',
      'tp hà nội': 'Ha Noi',

      // Da Nang
      'da nang': 'Da Nang',
      'đà nẵng': 'Da Nang',
      danang: 'Da Nang',
      dn: 'Da Nang',
      'thành phố đà nẵng': 'Da Nang',

      // Can Tho
      'can tho': 'Can Tho',
      'cần thơ': 'Can Tho',
      cantho: 'Can Tho',
      ct: 'Can Tho',

      // Hai Phong
      'hai phong': 'Hai Phong',
      'hải phòng': 'Hai Phong',
      haiphong: 'Hai Phong',
      hp: 'Hai Phong',
    };
  }

  /**
   * Recognize intent từ user input
   * @param {string} userInput - User input text
   * @param {string} frontend - 'fe' (candidate) hoặc 'fe-employer'
   * @param {string} sessionId - Session ID for Dialogflow
   * @returns {Promise<Object>} Intent recognition result với normalized parameters
   */
  async recognizeIntent(userInput, frontend = 'fe', sessionId = null) {
    if (!userInput || userInput.trim().length === 0) {
      return {
        success: false,
        error: 'Input is required',
      };
    }

    // Generate session ID if not provided
    if (!sessionId) {
      sessionId = `session-${frontend}-${Date.now()}`;
    }

    // Try Dialogflow first
    if (dialogflowService.isAvailable()) {
      try {
        const dialogflowResult = await dialogflowService.detectIntent(
          userInput,
          sessionId
        );

        if (dialogflowResult.success && dialogflowResult.intent) {
          // Normalize parameters (especially location)
          const normalizedParams = this._normalizeParameters(
            dialogflowResult.parameters
          );

          return {
            success: true,
            intent: dialogflowResult.intent,
            parameters: normalizedParams,
            confidence: dialogflowResult.confidence,
            method: 'dialogflow',
            fulfillmentText: dialogflowResult.fulfillmentText,
            originalInput: userInput,
          };
        }
      } catch (error) {
        logger.warn(
          '⚠️ Dialogflow recognition failed, using fallback:',
          error.message
        );
      }
    }

    // Fallback: Rule-based pattern matching
    return this._recognizeWithRules(userInput, frontend);
  }

  /**
   * Normalize parameters (đặc biệt là location)
   * @param {Object} parameters - Raw parameters từ Dialogflow
   * @returns {Object} Normalized parameters
   */
  _normalizeParameters(parameters) {
    if (!parameters || typeof parameters !== 'object') {
      return {};
    }

    const normalized = { ...parameters };

    // Normalize location fields
    const locationFields = [
      'location',
      'city',
      'address',
      'location_city',
      'job_location',
    ];

    locationFields.forEach(field => {
      if (normalized[field]) {
        const normalizedLocation = this._normalizeLocation(normalized[field]);
        if (normalizedLocation) {
          normalized[field] = normalizedLocation;
        }
      }
    });

    // Normalize salary (nếu có)
    if (normalized.salary || normalized.salary_min || normalized.salary_max) {
      // Convert "20 triệu" → 20000000
      const salaryFields = ['salary', 'salary_min', 'salary_max'];
      salaryFields.forEach(field => {
        if (normalized[field]) {
          normalized[field] = this._normalizeSalary(normalized[field]);
        }
      });
    }

    return normalized;
  }

  /**
   * Normalize location name
   * @param {string} location - Location name từ user input
   * @returns {string} Normalized location name
   */
  _normalizeLocation(location) {
    if (!location || typeof location !== 'string') {
      return location;
    }

    const normalized = normalizeVietnameseText(location);
    return this.locationMap[normalized] || location;
  }

  /**
   * Normalize salary value
   * @param {string|number} salary - Salary value (có thể là "20 triệu", "20tr", 20000000)
   * @returns {number} Salary in VND
   */
  _normalizeSalary(salary) {
    if (typeof salary === 'number') {
      return salary;
    }

    if (typeof salary !== 'string') {
      return null;
    }

    // Extract number
    const match = salary.match(/(\d+(?:\.\d+)?)\s*(?:triệu|tr|million|m)/i);
    if (match) {
      const number = parseFloat(match[1]);
      return Math.round(number * 1000000); // Convert to VND
    }

    // Try to parse as number
    const number = parseFloat(salary);
    if (!isNaN(number)) {
      // If number < 1000, assume it's in millions
      if (number < 1000) {
        return Math.round(number * 1000000);
      }
      return Math.round(number);
    }

    return null;
  }

  /**
   * Fallback: Rule-based intent recognition
   * @param {string} userInput - User input
   * @param {string} frontend - Frontend type
   * @returns {Object} Intent recognition result
   */
  _recognizeWithRules(userInput, frontend) {
    const input = normalizeVietnameseText(userInput);

    // Simple pattern matching
    const patterns = {
      'navigate.home': [
        /^(về|đi (đến|tới|vào)|quay lại|về lại)\s*(trang chủ|home|trang chính)/i,
        /^(trang chủ|home|trang chính)$/i,
        /về\s+home/i,
        /đi\s+home/i,
      ],
      'cv.create': [
        /tạo\s+(cv|hồ sơ|resume)/i,
        /làm\s+(cv|hồ sơ|resume)/i,
        /viết\s+(cv|hồ sơ)/i,
      ],
      'job.search': [
        /tìm\s+(việc|job|công việc)(?:\s+(.+?))?(?:\s+(?:tại|ở|in)|$)/i, // "tìm việc" hoặc "tìm việc IT"
        /tìm\s+kiếm\s+(việc|job)/i,
        /(việc|job)\s+(làm|tuyển)/i,
      ],
      'job.search.location': [
        /tìm\s+(việc|job)\s+(.+?)\s+(tại|ở|in)\s+(.+)/i, // "tìm việc IT ở Sài Gòn" - phải match trước
        /tìm\s+(việc|job)\s+(tại|ở|in)\s+(.+)/i, // "tìm việc ở Sài Gòn"
        /(việc|job)\s+(tại|ở|in)\s+(.+)/i, // "việc ở Sài Gòn"
      ],
      'profile.view': [
        /xem\s+(hồ sơ|profile|thông tin)\s+(của\s+)?(tôi|mình|mình)/i,
        /(hồ sơ|profile)\s+(của\s+)?(tôi|mình)/i,
      ],
    };

    for (const [intent, patternList] of Object.entries(patterns)) {
      for (const pattern of Array.isArray(patternList)
        ? patternList
        : [patternList]) {
        const match = userInput.match(pattern);
        if (match) {
          const params = {};

          // Extract location and keyword if present
          if (intent === 'job.search.location') {
            // Pattern 1: "tìm việc [keyword] ở [location]" -> match[2] = keyword, match[4] = location
            // Pattern 2: "tìm việc ở [location]" -> match[3] = location
            if (match[4]) {
              // Format: "tìm việc IT ở Sài Gòn" -> match[2] = "IT", match[4] = "Sài Gòn"
              if (match[2] && match[2].trim()) {
                params.keyword = match[2].trim();
              }
              params.city = this._normalizeLocation(match[4].trim());
            } else if (match[3]) {
              // Format: "tìm việc ở Sài Gòn" -> match[3] = "Sài Gòn"
              params.city = this._normalizeLocation(match[3].trim());
            }
          } else if (intent === 'job.search' && match[2]) {
            // Extract keyword from "tìm việc [keyword]"
            const keyword = match[2].trim();
            if (keyword && keyword.length > 0) {
              params.keyword = keyword;
            }
          }

          return {
            success: true,
            intent,
            parameters: params,
            confidence: 0.7,
            method: 'rule-based',
            originalInput: userInput,
          };
        }
      }
    }

    return {
      success: false,
      error: 'Could not recognize intent',
      method: 'rule-based',
      suggestions: [
        'Tìm việc làm',
        'Tạo CV online',
        'Xem thông tin cá nhân',
        'Về trang chủ',
      ],
    };
  }
}

module.exports = new DialogflowIntentService();
