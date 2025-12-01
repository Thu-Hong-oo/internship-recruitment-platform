const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../../utils/logger');
const { getSkillNormalizationService } = require('./skillNormalizationService');
const phobertService = require('../phobertService');
require('dotenv').config();

/**
 * 🧠 Intelligent Skill Extraction Service
 * 
 * SELF-SUFFICIENT NLP service
 * Primary: PhoBERT NER model (trained, 96% F1)
 * Optional: Gemini API for enhancement (if available)
 * 
 * Strategy:
 * 1. PhoBERT first (fast, accurate, offline)
 * 2. Gemini enhancement ONLY if explicitly requested (online, slow, optional)
 * 3. Rule-based fallback if both fail
 */
class SkillExtractionService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    this.model = null;
    this.normalizationService = getSkillNormalizationService();
    this.cache = new Map(); // Cache extracted skills từ text để tăng tốc độ
    
    // Initialize Gemini model (OPTIONAL - only for enhancement)
    if (this.geminiApiKey && this.geminiApiKey.startsWith('AIzaSy')) {
      try {
        const genAI = new GoogleGenerativeAI(this.geminiApiKey);
        this.model = genAI.getGenerativeModel({ 
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp' 
        });
        logger.info('✅ SkillExtractionService: Gemini available for optional enhancement');
      } catch (error) {
        logger.warn('⚠️ SkillExtractionService: Gemini not available (not critical)', error.message);
      }
    } else {
      logger.info('ℹ️ SkillExtractionService: Running in self-sufficient mode (PhoBERT only)');
    }
  }

  /**
   * Extract skills từ CV text sử dụng PhoBERT (primary) + optional Gemini enhancement
   * 
   * STRATEGY:
   * 1. PhoBERT first (default, fast, offline)
   * 2. Gemini enhancement (optional, if useGemini=true AND API available)
   * 3. Rule-based fallback (if PhoBERT fails)
   * 
   * @param {string} cvText - CV text content
   * @param {Object} options - Extraction options
   * @returns {Promise<Array>} Array of extracted skills với format: { name, type, level, confidence }
   */
  async extractSkills(cvText, options = {}) {
    if (!cvText || typeof cvText !== 'string' || cvText.trim().length === 0) {
      return [];
    }

    const {
      maxSkills = 50,
      minConfidence = 0.5,
      includeSoftSkills = true,
      includeLanguages = true,
      useCache = true,
      usePhoBERT = true,       // DEFAULT: true (primary method)
      useGemini = false,        // DEFAULT: false (optional enhancement)
      useHybrid = false,        // DEFAULT: false (use only if explicitly requested)
    } = options;

    // Check cache (simple hash-based)
    const textHash = this._hashText(cvText.substring(0, 1000)); // Hash first 1000 chars
    if (useCache && this.cache.has(textHash)) {
      const cached = this.cache.get(textHash);
      logger.debug(`✅ Using cached skills extraction (${cached.length} skills)`);
      return cached;
    }

    // STRATEGY 1: PHOBERT FIRST (Primary, Self-Sufficient)
    if (usePhoBERT && !useHybrid) {
      try {
        logger.info('🤖 Using PhoBERT (primary method)');
        return await this._phobertExtract(cvText, options);
      } catch (error) {
        logger.warn('⚠️ PhoBERT extraction failed, trying fallback:', error.message);
      }
    }

    // STRATEGY 2: HYBRID (PhoBERT + Gemini) - only if explicitly requested
    if (useHybrid && usePhoBERT && useGemini && this.model) {
      try {
        logger.info('🔬 Using HYBRID (PhoBERT + Gemini enhancement)');
        return await this._hybridExtract(cvText, options);
      } catch (error) {
        logger.warn('⚠️ Hybrid extraction failed, falling back to PhoBERT only:', error.message);
        
        // Fallback to PhoBERT only
        try {
          return await this._phobertExtract(cvText, options);
        } catch (phobertError) {
          logger.error('❌ PhoBERT fallback also failed:', phobertError.message);
        }
      }
    }

    // STRATEGY 3: Gemini only (if explicitly requested and available)
    if (useGemini && this.model && !usePhoBERT) {
      try {
        logger.info('🌐 Using Gemini only (optional method)');
        return await this._geminiExtract(cvText, options);
      } catch (error) {
        logger.warn('⚠️ Gemini extraction failed:', error.message);
      }
    }

    // STRATEGY 4: Rule-based fallback (always works)
    logger.info('📋 Using rule-based fallback');
    return this._fallbackExtract(cvText, options);
  }

  /**
   * Extract skills using Gemini API only (OPTIONAL METHOD)
   */
  async _geminiExtract(cvText, options = {}) {
    const { 
      maxSkills = 50, 
      minConfidence = 0.5, 
      useCache = true,
      includeSoftSkills = true,
      includeLanguages = true
    } = options;

    if (!this.model) {
      throw new Error('Gemini model not available');
    }

    try {
      logger.info('🌐 Extracting skills using Gemini API');

      // Truncate text nếu quá dài
      const maxTextLength = 8000;
      const truncatedText = cvText.length > maxTextLength 
        ? cvText.substring(0, maxTextLength) + '...' 
        : cvText;

      const prompt = `Extract all technical skills, soft skills, and language skills from this CV/resume text.

Return a JSON array of skills with this exact format:
[
  {
    "name": "JavaScript",
    "type": "programming_language",
    "level": "intermediate",
    "confidence": 0.9
  }
]

Skill types: programming_language, framework, database, tool, soft_skill, language, other
Level: beginner, intermediate, advanced, expert, unknown
Confidence: 0.0-1.0

${includeSoftSkills ? 'Include soft skills.' : 'Exclude soft skills.'}
${includeLanguages ? 'Include language skills.' : 'Exclude language skills.'}

CV Text:
${truncatedText}

Return ONLY valid JSON array:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().trim();

      // Parse JSON response
      const cleanedJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let skills = JSON.parse(cleanedJson);
      
      if (!Array.isArray(skills)) {
        throw new Error('Response is not an array');
      }

      // Normalize skills
      const skillNames = skills.filter(s => s && s.name).map(s => s.name);
      const normalizedMap = await this.normalizationService.normalizeSkillsBatch(skillNames, useCache);
      
      const normalizedSkills = skills
        .filter(skill => skill && skill.name)
        .map((skill) => {
          const normalizedName = normalizedMap.get(skill.name) || skill.name;
          
          return {
            name: normalizedName,
            type: skill.type || 'other',
            level: skill.level || 'unknown',
            confidence: Math.max(0, Math.min(1, skill.confidence || 0.5)),
          };
        });

      // Filter và sort
      const filtered = normalizedSkills
        .filter(skill => skill.confidence >= minConfidence)
        .slice(0, maxSkills)
        .sort((a, b) => b.confidence - a.confidence);

      // Cache result
      if (useCache) {
        const textHash = this._hashText(cvText.substring(0, 1000));
        this.cache.set(textHash, filtered);
      }

      logger.info(`✅ Gemini extracted ${filtered.length} skills`);
      return filtered;
    } catch (parseError) {
      logger.warn('⚠️ Failed to parse Gemini response:', parseError.message);
      throw parseError;
    }
  }

  /**
   * HYBRID: Combine PhoBERT (fast, accurate) + Gemini (comprehensive, context-aware)
   * ONLY use when explicitly requested (useHybrid=true)
   */
  async _hybridExtract(cvText, options = {}) {
    const { maxSkills = 50, minConfidence = 0.5, useCache = true } = options;
    
    try {
      logger.info('🔬 Using HYBRID extraction (PhoBERT + Gemini)');
      
      // Step 1: PhoBERT for fast, accurate skill extraction
      const phobertSkills = await phobertService.extractSkills(cvText);
      logger.info(`📊 PhoBERT found ${phobertSkills.length} skills`);

      if (!this.model) {
        logger.warn('Gemini not available, returning PhoBERT results only');
        return await this._phobertExtract(cvText, options);
      }

      // Step 2: Gemini for comprehensive analysis (types, levels, soft skills)
      const truncatedText = cvText.length > 8000 
        ? cvText.substring(0, 8000) + '...' 
        : cvText;

      const prompt = `Analyze these skills extracted from a CV and enhance them with type, level, and confidence information.

Extracted skills: ${JSON.stringify(phobertSkills)}

For each skill, provide:
1. type: programming_language, framework, database, tool, soft_skill, language, or other
2. level: beginner, intermediate, advanced, expert, or unknown
3. confidence: 0.0-1.0 based on context in CV

Also add any additional skills you find that PhoBERT might have missed (especially soft skills, methodologies like Agile, Scrum, etc.)

Return a JSON array with format:
[
  {
    "name": "JavaScript",
    "type": "programming_language",
    "level": "advanced",
    "confidence": 0.95,
    "source": "phobert" or "gemini"
  }
]

CV Context (first 2000 chars):
${truncatedText.substring(0, 2000)}

Return ONLY valid JSON:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().trim();

      // Parse Gemini response
      const cleanedJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let enhancedSkills = JSON.parse(cleanedJson);

      if (!Array.isArray(enhancedSkills)) {
        throw new Error('Invalid Gemini response format');
      }

      // Normalize all skills
      const skillNames = enhancedSkills.map(s => s.name);
      const normalizedMap = await this.normalizationService.normalizeSkillsBatch(
        skillNames, 
        useCache
      );

      // Apply normalization
      const finalSkills = enhancedSkills
        .map(skill => ({
          ...skill,
          name: normalizedMap.get(skill.name) || skill.name,
        }))
        .filter(s => s.confidence >= minConfidence)
        .slice(0, maxSkills)
        .sort((a, b) => b.confidence - a.confidence);

      logger.info(`✅ HYBRID extracted ${finalSkills.length} skills (${phobertSkills.length} from PhoBERT + ${finalSkills.filter(s => s.source === 'gemini').length} from Gemini)`);

      // Cache result
      if (useCache) {
        const textHash = this._hashText(cvText.substring(0, 1000));
        this.cache.set(textHash, finalSkills);
      }

      return finalSkills;
    } catch (error) {
      logger.error('❌ Hybrid extraction error:', error.message);
      
      // Fallback to PhoBERT only
      try {
        return await this._phobertExtract(cvText, options);
      } catch (phobertError) {
        logger.error('❌ PhoBERT fallback also failed:', phobertError.message);
        return this._fallbackExtract(cvText, options);
      }
    }
  }

  /**
   * Fallback extraction khi không có AI
   * Sử dụng pattern matching cơ bản
   */
  _fallbackExtract(cvText, options = {}) {
    const {
      maxSkills = 50,
      minConfidence = 0.5,
    } = options;

    const skills = [];
    const lowerText = cvText.toLowerCase();

    // Basic skill patterns (minimal fallback list)
    const basicSkills = [
      // Programming languages
      'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript',
      // Frontend
      'react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'next.js', 'nuxt.js',
      // Backend
      'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'fastapi', 'nest.js', '.net',
      // Databases
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible', 'ci/cd', 'nginx',
      // Tools
      'git', 'jira', 'confluence', 'figma',
      // Languages
      'english', 'vietnamese', 'chinese', 'japanese', 'korean', 'tiếng anh', 'tiếng việt', 'tiếng trung', 'tiếng nhật', 'tiếng hàn',
    ];

    const foundSkills = new Set();

    for (const skill of basicSkills) {
      if (foundSkills.has(skill)) continue;

      const skillRegex = new RegExp(
        `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );

      if (skillRegex.test(lowerText)) {
        foundSkills.add(skill);
        skills.push({
          name: skill,
          type: this._inferSkillType(skill),
          level: 'unknown',
          confidence: 0.6, // Lower confidence for fallback
        });
      }
    }

    return skills
      .filter(s => s.confidence >= minConfidence)
      .slice(0, maxSkills);
  }

  /**
   * Infer skill type từ skill name
   */
  _inferSkillType(skillName) {
    const normalized = skillName.toLowerCase();
    
    const programmingLanguages = ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript', 'r', 'matlab', 'scala', 'perl'];
    const frameworks = ['react', 'vue', 'angular', 'django', 'flask', 'spring', 'laravel', 'rails', 'fastapi', 'express', 'nest.js', 'next.js', 'nuxt.js'];
    const databases = ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite', 'mariadb', 'cassandra', 'dynamodb'];
    const tools = ['git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'terraform', 'ansible', 'jira', 'confluence', 'figma'];
    
    if (programmingLanguages.includes(normalized)) return 'programming_language';
    if (frameworks.includes(normalized)) return 'framework';
    if (databases.includes(normalized)) return 'database';
    if (tools.includes(normalized)) return 'tool';
    if (['english', 'vietnamese', 'chinese', 'japanese', 'korean', 'tiếng anh', 'tiếng việt', 'tiếng trung', 'tiếng nhật', 'tiếng hàn'].includes(normalized)) return 'language';
    
    return 'other';
  }

  /**
   * Simple hash function for caching
   */
  _hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
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
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
    };
  }

  /**
   * Extract skills using PhoBERT NER model only (PRIMARY METHOD)
   */
  async _phobertExtract(cvText, options = {}) {
    const { maxSkills = 50, minConfidence = 0.5, useCache = true } = options;
    
    try {
      logger.info('🤖 Extracting skills using PhoBERT NER model');
      
      // Call PhoBERT service
      const extractedSkills = await phobertService.extractSkills(cvText);
      
      if (!extractedSkills || extractedSkills.length === 0) {
        logger.warn('PhoBERT returned no skills, using fallback');
        return this._fallbackExtract(cvText, options);
      }

      // Normalize skills
      const normalizedMap = await this.normalizationService.normalizeSkillsBatch(
        extractedSkills, 
        useCache
      );

      // Format skills with confidence scores
      const formattedSkills = extractedSkills
        .map(skill => {
          const normalizedName = normalizedMap.get(skill) || skill;
          return {
            name: normalizedName,
            type: this._inferSkillType(normalizedName), // Use shared type inference
            level: 'unknown',
            confidence: 0.88, // PhoBERT has high confidence (88% based on F1 96%)
          };
        })
        .filter(s => s.confidence >= minConfidence)
        .slice(0, maxSkills);

      logger.info(`✅ PhoBERT extracted ${formattedSkills.length} skills`);
      
      // Cache result
      if (useCache) {
        const textHash = this._hashText(cvText.substring(0, 1000));
        this.cache.set(textHash, formattedSkills);
      }

      return formattedSkills;
    } catch (error) {
      logger.error('❌ PhoBERT extraction error:', error.message);
      return this._fallbackExtract(cvText, options);
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get singleton instance
 */
function getSkillExtractionService() {
  if (!instance) {
    instance = new SkillExtractionService();
  }
  return instance;
}

module.exports = {
  SkillExtractionService,
  getSkillExtractionService,
};

