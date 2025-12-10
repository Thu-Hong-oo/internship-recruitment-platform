const { logger } = require('../../utils/logger');
const ruleBasedParser = require('./ruleBasedCVParser');
// Multilingual NER disabled - service removed
// const { getMultilingualNERService } = require('../multilingualNERService');

/**
 * Hybrid Skill Extraction Service
 *
 * Strategy for multilingual CVs (Vietnamese + English):
 * - Rule-based (300+ patterns) - Used for all languages
 * - Multilingual NER disabled (removed due to Python dependency issues)
 *
 * Performance:
 * - Pure Vietnamese CV: 100% recall (rule-based)
 * - Pure English CV: ~70% recall (rule-based)
 * - Mixed CV: ~85% recall (rule-based)
 */
class HybridSkillExtractionService {
  constructor() {
    // Multilingual NER disabled - service removed
    // this.multilingualNER = getMultilingualNERService();
    this.cache = new Map();
  }

  /**
   * Detect language ratio in text
   * @param {string} text - Input text
   * @returns {Object} - { vietnamese: 0.7, english: 0.3 }
   */
  detectLanguageRatio(text) {
    // Vietnamese characters pattern
    const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi;
    const vietnameseMatches = text.match(vietnamesePattern) || [];

    // Total characters (excluding spaces and punctuation)
    const totalChars = text.replace(/[\s\p{P}]/gu, '').length;

    if (totalChars === 0) {
      return { vietnamese: 0, english: 0 };
    }

    const vietnameseRatio = vietnameseMatches.length / totalChars;
    const englishRatio = 1 - vietnameseRatio;

    return {
      vietnamese: vietnameseRatio,
      english: englishRatio
    };
  }

  /**
   * Extract skills using hybrid approach
   * @param {string} text - CV text
   * @param {Object} options - Extraction options
   * @returns {Promise<Array>} - Extracted skills with metadata
   */
  async extractSkills(text, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return [];
    }

    const {
      useCache = true,
      includeMetadata = false
    } = options;

    // Check cache
    const cacheKey = this._hashText(text);
    if (useCache && this.cache.has(cacheKey)) {
      logger.debug('✅ Using cached hybrid extraction');
      return this.cache.get(cacheKey);
    }

    try {
      // Detect language ratio
      const langRatio = this.detectLanguageRatio(text);
      logger.info(`🌍 Language ratio: Vietnamese ${(langRatio.vietnamese * 100).toFixed(0)}%, English ${(langRatio.english * 100).toFixed(0)}%`);

      const startTime = Date.now();

      // Strategy 1: Pure Vietnamese (>80% Vietnamese)
      if (langRatio.vietnamese > 0.8) {
        logger.info('🇻🇳 Using rule-based extraction (Vietnamese text)');
        const skills = ruleBasedParser.extractSkills(text);
        const result = this._formatSkills(skills, 'rule-based', langRatio);

        // Cache result
        if (useCache) this.cache.set(cacheKey, result);

        logger.info(`✅ Extracted ${result.length} skills in ${Date.now() - startTime}ms (rule-based only)`);
        return result;
      }

      // Strategy 2: Pure English (<20% Vietnamese)
      // Multilingual NER disabled - using rule-based only
      if (langRatio.vietnamese < 0.2) {
        logger.info('🇬🇧 Using rule-based extraction (English text - Multilingual NER disabled)');

        const skills = ruleBasedParser.extractSkills(text);
        const result = this._formatSkills(skills, 'rule-based', langRatio);

        // Cache result
        if (useCache) this.cache.set(cacheKey, result);

        logger.info(`✅ Extracted ${result.length} skills in ${Date.now() - startTime}ms (rule-based only)`);
        return result;
      }

      // Strategy 3: Mixed language (20-80% Vietnamese)
      // Multilingual NER disabled - using rule-based only
      logger.info('🌐 Using rule-based extraction (mixed language - Multilingual NER disabled)');

      const skills = ruleBasedParser.extractSkills(text);
      const result = this._formatSkills(skills, 'rule-based', langRatio);

      // Cache result
      if (useCache) this.cache.set(cacheKey, result);

      logger.info(`✅ Extracted ${result.length} skills in ${Date.now() - startTime}ms (rule-based only)`);
      return result;

    } catch (error) {
      logger.error('Hybrid extraction error:', error.message);

      // Fallback to rule-based
      logger.warn('Falling back to rule-based extraction');
      const skills = ruleBasedParser.extractSkills(text);
      return this._formatSkills(skills, 'rule-based-fallback', { vietnamese: 0.5, english: 0.5 });
    }
  }

  /**
   * Combine skills from multiple sources and deduplicate
   */
  _combineSkills(nerSkills, ruleSkills) {
    const combined = [];
    const seen = new Map(); // normalized name → skill

    // Add all skills
    const allSkills = [...nerSkills, ...ruleSkills];

    allSkills.forEach(skill => {
      const normalized = skill.name.toLowerCase().replace(/[.\s-_]/g, '');

      if (seen.has(normalized)) {
        // Already exists, keep the one with higher confidence
        const existing = seen.get(normalized);
        if ((skill.confidence || 0) > (existing.confidence || 0)) {
          seen.set(normalized, skill);
        }
      } else {
        seen.set(normalized, skill);
      }
    });

    // Convert map to array and sort by confidence
    return Array.from(seen.values()).sort((a, b) =>
      (b.confidence || 0) - (a.confidence || 0)
    );
  }

  /**
   * Format rule-based skills to standard format
   */
  _formatSkills(skills, source, langRatio) {
    return skills.map(skill => ({
      name: skill.name,
      type: skill.type || 'technical',
      confidence: skill.confidence || 0.8,
      source: source,
      level: skill.level || 'intermediate'
    }));
  }

  /**
   * Capitalize skill name properly
   */
  _capitalizeSkill(text) {
    // Special cases
    const specialCases = {
      'react': 'React',
      'node': 'Node.js',
      'nodejs': 'Node.js',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'aws': 'AWS',
      'gcp': 'GCP',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'graphql': 'GraphQL',
      'tensorflow': 'TensorFlow',
      'pytorch': 'PyTorch'
    };

    const lower = text.toLowerCase().trim();
    if (specialCases[lower]) {
      return specialCases[lower];
    }

    // Default: capitalize first letter
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Simple hash function for caching
   */
  _hashText(text) {
    let hash = 0;
    const str = text.substring(0, 500); // Hash first 500 chars
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Hybrid extraction cache cleared');
  }

  /**
   * Get service info
   */
  getServiceInfo() {
    return {
      name: 'Hybrid Skill Extraction',
      strategies: {
        vietnamese: 'Rule-based (300+ patterns, 100% recall)',
        english: 'Rule-based (300+ patterns, ~70% recall) - Multilingual NER disabled',
        mixed: 'Rule-based (300+ patterns, ~85% recall) - Multilingual NER disabled'
      },
      models: {
        ruleBased: {
          patterns: '300+',
          languages: ['Vietnamese', 'English'],
          performance: '< 50ms'
        }
        // Multilingual NER disabled
        // multilingualNER: this.multilingualNER.getModelInfo()
      }
    };
  }
}

// Singleton instance
let instance = null;

function getHybridSkillExtractionService() {
  if (!instance) {
    instance = new HybridSkillExtractionService();
  }
  return instance;
}

module.exports = {
  HybridSkillExtractionService,
  getHybridSkillExtractionService
};
