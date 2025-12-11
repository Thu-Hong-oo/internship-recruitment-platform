const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../../utils/logger');
require('dotenv').config();

/**
 * 🧠 Intelligent Skill Normalization Service
 * Sử dụng Gemini AI để tự động normalize skills thay vì hardcode
 * 
 * Ví dụ:
 * - "JS" → "JavaScript"
 * - "Nodejs" → "Node.js"
 * - "ReactJS" → "React"
 * - "Postgres" → "PostgreSQL"
 */
class SkillNormalizationService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    this.model = null;
    this.cache = new Map(); // Cache normalized skills để tăng tốc độ
    this.batchCache = new Map(); // Cache batch normalization
    
    // Initialize Gemini model
    if (this.geminiApiKey && this.geminiApiKey.startsWith('AIzaSy')) {
      try {
        const genAI = new GoogleGenerativeAI(this.geminiApiKey);
        this.model = genAI.getGenerativeModel({ 
          model: process.env.GEMINI_MODEL
        });
        logger.info('✅ SkillNormalizationService: Gemini model initialized');
      } catch (error) {
        logger.warn('⚠️ SkillNormalizationService: Failed to initialize Gemini model', error.message);
      }
    } else {
      logger.warn('⚠️ SkillNormalizationService: GEMINI_API_KEY not available, using fallback normalization');
    }
  }

  /**
   * Normalize một skill name sử dụng AI
   * @param {string} skillName - Skill name cần normalize
   * @param {boolean} useCache - Có sử dụng cache không (default: true)
   * @returns {Promise<string>} Normalized skill name
   */
  async normalizeSkill(skillName, useCache = true) {
    if (!skillName || typeof skillName !== 'string') {
      return '';
    }

    const normalized = skillName.toLowerCase().trim();
    if (!normalized) return '';

    // Check cache first
    if (useCache && this.cache.has(normalized)) {
      return this.cache.get(normalized);
    }

    // Nếu không có Gemini, dùng fallback normalization
    if (!this.model) {
      return this._fallbackNormalize(normalized);
    }

    try {
      const prompt = `Normalize this technical skill name to its standard/canonical form. 
Return ONLY the normalized skill name, nothing else.

Examples:
- "JS" → "JavaScript"
- "Nodejs" → "Node.js"
- "ReactJS" → "React"
- "Postgres" → "PostgreSQL"
- "AWS" → "AWS"
- "GitHub" → "Git"
- "TypeScript" → "TypeScript"

Skill to normalize: "${normalized}"

Normalized skill:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const normalizedSkill = response.text().trim().toLowerCase();

      // Cache result
      if (useCache) {
        this.cache.set(normalized, normalizedSkill);
      }

      return normalizedSkill;
    } catch (error) {
      logger.warn(`⚠️ Failed to normalize skill "${normalized}" with AI, using fallback:`, error.message);
      return this._fallbackNormalize(normalized);
    }
  }

  /**
   * Normalize nhiều skills cùng lúc (batch processing)
   * @param {string[]} skillNames - Array of skill names
   * @param {boolean} useCache - Có sử dụng cache không
   * @returns {Promise<Map<string, string>>} Map từ original → normalized
   */
  async normalizeSkillsBatch(skillNames, useCache = true) {
    if (!Array.isArray(skillNames) || skillNames.length === 0) {
      return new Map();
    }

    const result = new Map();
    const toNormalize = [];

    // Check cache first
    for (const skill of skillNames) {
      const normalized = skill.toLowerCase().trim();
      if (!normalized) continue;

      if (useCache && this.cache.has(normalized)) {
        result.set(skill, this.cache.get(normalized));
      } else {
        toNormalize.push(normalized);
      }
    }

    // Nếu tất cả đã có trong cache
    if (toNormalize.length === 0) {
      return result;
    }

    // Nếu không có Gemini, dùng fallback
    if (!this.model) {
      for (const skill of toNormalize) {
        const normalized = this._fallbackNormalize(skill);
        result.set(skill, normalized);
        if (useCache) {
          this.cache.set(skill, normalized);
        }
      }
      return result;
    }

    try {
      // TỐI ƯU: Batch normalize với Gemini (giới hạn số lượng để tăng tốc)
      // Prompt ngắn gọn hơn để tăng tốc độ
      const skillsList = toNormalize.map(s => `"${s}"`).join(', ');
      const prompt = `Normalize skill names to standard forms. Return JSON.

Examples: {"js": "javascript", "nodejs": "node.js"}

Skills: [${skillsList}]

Return JSON only:`;

      const result_ai = await this.model.generateContent(prompt);
      const response = await result_ai.response;
      const jsonText = response.text().trim();
      
      // Parse JSON response
      let normalizedMap = {};
      try {
        // Remove markdown code blocks if present
        const cleanedJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        normalizedMap = JSON.parse(cleanedJson);
      } catch (parseError) {
        logger.warn('⚠️ Failed to parse AI response, using fallback normalization');
        // Fallback: normalize individually
        for (const skill of toNormalize) {
          normalizedMap[skill] = await this.normalizeSkill(skill, useCache);
        }
      }

      // Store results
      for (const skill of toNormalize) {
        const normalized = normalizedMap[skill]?.toLowerCase().trim() || this._fallbackNormalize(skill);
        result.set(skill, normalized);
        if (useCache) {
          this.cache.set(skill, normalized);
        }
      }

      return result;
    } catch (error) {
      logger.warn('⚠️ Failed to batch normalize skills with AI, using fallback:', error.message);
      // Fallback: normalize individually
      for (const skill of toNormalize) {
        const normalized = this._fallbackNormalize(skill);
        result.set(skill, normalized);
        if (useCache) {
          this.cache.set(skill, normalized);
        }
      }
      return result;
    }
  }

  /**
   * Check if two skills are equivalent (same skill, different names)
   * @param {string} skill1 
   * @param {string} skill2 
   * @returns {Promise<boolean>}
   */
  async areSkillsEquivalent(skill1, skill2) {
    if (!skill1 || !skill2) return false;
    
    const normalized1 = await this.normalizeSkill(skill1);
    const normalized2 = await this.normalizeSkill(skill2);
    
    return normalized1 === normalized2;
  }

  /**
   * Fallback normalization khi không có AI
   * Sử dụng một số rules cơ bản
   */
  _fallbackNormalize(skillName) {
    const normalized = skillName.toLowerCase().trim();
    
    // Basic normalization rules
    const rules = {
      // JavaScript variants
      'js': 'javascript',
      'ecmascript': 'javascript',
      'es6': 'javascript',
      'es2015': 'javascript',
      
      // Node.js variants
      'nodejs': 'node.js',
      'node': 'node.js',
      
      // React variants
      'reactjs': 'react',
      'react.js': 'react',
      
      // TypeScript variants
      'ts': 'typescript',
      
      // Database variants
      'postgres': 'postgresql',
      
      // Cloud variants
      'amazon web services': 'aws',
      'google cloud': 'gcp',
      'google cloud platform': 'gcp',
      
      // Git variants
      'github': 'git',
      'gitlab': 'git',
      'version control': 'git',
    };

    if (rules[normalized]) {
      return rules[normalized];
    }

    // Remove common prefixes/suffixes
    const cleaned = normalized
      .replace(/^proficient\s+in\s+/i, '')
      .replace(/\s+experience$/i, '')
      .replace(/\s+skill$/i, '')
      .trim();

    return cleaned;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.batchCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      batchCacheSize: this.batchCache.size,
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get singleton instance
 */
function getSkillNormalizationService() {
  if (!instance) {
    instance = new SkillNormalizationService();
  }
  return instance;
}

module.exports = {
  SkillNormalizationService,
  getSkillNormalizationService,
};

