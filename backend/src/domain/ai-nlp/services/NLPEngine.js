/**
 * NLPEngine
 * Domain: AI/NLP
 * Core NLP processing engine for text analysis, entity extraction, and semantic understanding
 */
const AdvancedNLPEngine = require('./AdvancedNLPEngine');

class NLPEngine {
  constructor(props = {}) {
    this._nlpLibrary = props.nlpLibrary || 'compromise'; // Could be 'compromise', 'natural', 'spacy-node', etc.
    this._language = props.language || 'en';
    this._confidenceThreshold = props.confidenceThreshold || 0.7;
    this._useAdvancedEngine = props.useAdvancedEngine || false;

    // Initialize advanced engine if requested
    if (this._useAdvancedEngine) {
      this._advancedEngine = new AdvancedNLPEngine();
    }
  }

  /**
   * Extract skills from text content
   * @param {string} text - Text to analyze
   * @returns {Promise<Array>} Array of extracted skills with confidence scores
   */
  async extractSkills(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Use advanced engine if enabled (research mode)
    if (this._useAdvancedEngine && this._advancedEngine) {
      try {
        const advancedSkills = await this._advancedEngine.extractSkills(text);
        return advancedSkills.map(skill => ({
          skill: skill.skill,
          confidence: skill.confidence,
          category: skill.category,
          level: skill.level,
          context: skill.context,
        }));
      } catch (error) {
        console.warn(
          'Advanced NLP engine failed, falling back to traditional:',
          error.message
        );
        // Fall back to traditional method
      }
    }

    // Traditional regex-based extraction
    const normalizedText = this._normalizeText(text);

    const skillPatterns = [
      // Technical skills
      /\b(javascript|python|java|c\+\+|c#|php|ruby|go|rust|kotlin|swift|scala|perl|r|matlab)\b/gi,
      /\b(react|angular|vue|node\.js|nodejs|express|django|flask|spring|hibernate|laravel)\b/gi,
      /\b(html|css|sass|scss|less|bootstrap|tailwind|materialui)\b/gi,
      /\b(sql|mysql|postgresql|mongodb|redis|cassandra|elasticsearch)\b/gi,
      /\b(aws|azure|gcp|docker|kubernetes|jenkins|gitlab|github)\b/gi,
      /\b(machinelearning|deeplearning|ai|artificialintelligence|nlp|computervision)\b/gi,
      /\b(datascience|dataanalysis|businessintelligence|etl|datawarehousing)\b/gi,

      // Soft skills
      /\b(communication|leadership|teamwork|problemsolving|criticalthinking)\b/gi,
      /\b(projectmanagement|agile|scrum|kanban|waterfall)\b/gi,
      /\b(english|french|german|spanish|chinese|japanese)\b/gi,
    ];

    const extractedSkills = new Map();

    for (const pattern of skillPatterns) {
      const matches = normalizedText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const skill = this._normalizeSkillName(match.toLowerCase());
          const confidence = this._calculateSkillConfidence(
            skill,
            normalizedText
          );
          if (confidence >= 0.3) {
            extractedSkills.set(skill, {
              skill: skill,
              confidence: confidence,
              category: this._categorizeSkill(skill),
            });
          }
        });
      }
    }

    return Array.from(extractedSkills.values());
  }

  /**
   * Calculate semantic similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async calculateSemanticSimilarity(text1, text2) {
    if (
      !text1 ||
      !text2 ||
      typeof text1 !== 'string' ||
      typeof text2 !== 'string'
    ) {
      return 0;
    }

    // Use advanced engine if enabled (research mode)
    if (this._useAdvancedEngine && this._advancedEngine) {
      try {
        return await this._advancedEngine.calculateSemanticSimilarity(
          text1,
          text2
        );
      } catch (error) {
        console.warn(
          'Advanced NLP engine failed, falling back to traditional:',
          error.message
        );
        // Fall back to traditional method
      }
    }

    // Traditional similarity calculation (simple word overlap)
    const words1 = this._normalizeText(text1).split(/\s+/);
    const words2 = this._normalizeText(text2).split(/\s+/);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Extract job requirements from job description
   * @param {string} jobDescription - Job description text
   * @returns {Promise<Object>} Structured job requirements
   */
  async extractJobRequirements(jobDescription) {
    if (!jobDescription || typeof jobDescription !== 'string') {
      return {
        skills: [],
        experience: [],
        education: [],
        certifications: [],
      };
    }

    const normalizedText = this._normalizeText(jobDescription);

    // Extract skills
    const skills = await this.extractSkills(jobDescription);

    // Extract experience requirements
    const experience = this._extractExperienceRequirements(normalizedText);

    // Extract education requirements
    const education = this._extractEducationRequirements(normalizedText);

    return {
      skills,
      experience,
      education,
      certifications: [],
    };
  }

  /**
   * Extract candidate information from CV/resume
   * @param {string} cvText - CV/resume text content
   * @returns {Promise<Object>} Structured candidate information
   */
  async extractCandidateInfo(cvText) {
    if (!cvText || typeof cvText !== 'string') {
      return {
        name: null,
        skills: [],
        experience: [],
        education: [],
      };
    }

    // Extract name before normalization (preserves line breaks)
    const name = this._extractName(cvText);

    const normalizedText = this._normalizeText(cvText);

    // Extract skills
    const skills = await this.extractSkills(cvText);

    // Extract work experience
    const experience = this._extractExperienceStrings(cvText);

    // Extract education
    const education = this._extractEducationStrings(cvText);

    return {
      name,
      skills: skills.map(s => s.skill || s),
      experience,
      education,
    };
  }

  /**
   * Analyze Vietnamese CV with advanced NLP processing
   * @param {string} cvText - Vietnamese CV text
   * @returns {Promise<Object>} Analysis results with Vietnamese support
   */
  async analyzeVietnameseCV(cvText) {
    if (!cvText || typeof cvText !== 'string') {
      return {
        entities: [],
        skills: [],
        experience: [],
        language: 'unknown',
        confidence: 0,
      };
    }

    // Use advanced engine if enabled (research mode)
    if (this._useAdvancedEngine && this._advancedEngine) {
      try {
        return await this._advancedEngine.analyzeVietnameseCV(cvText);
      } catch (error) {
        console.warn(
          'Advanced Vietnamese NLP failed, falling back to basic:',
          error.message
        );
        // Fall back to basic processing
      }
    }

    // Basic Vietnamese processing (fallback)
    const normalizedText = this._normalizeText(cvText);

    return {
      entities: this._extractBasicEntities(normalizedText),
      skills: await this.extractSkills(cvText),
      experience: this._extractBasicExperience(normalizedText),
      language: this._detectLanguage(cvText),
      confidence: 0.5, // Basic confidence
    };
  }

  /**
   * Calculate semantic similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    // Simple implementation using Jaccard similarity of words
    // In a real implementation, this would use word embeddings or transformers
    const words1 = new Set(this._tokenize(text1).map(w => w.toLowerCase()));
    const words2 = new Set(this._tokenize(text2).map(w => w.toLowerCase()));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate semantic similarity between two texts (alias for calculateSimilarity)
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async calculateSemanticSimilarity(text1, text2) {
    return this.calculateSimilarity(text1, text2);
  }

  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Sentiment analysis result
   */
  async analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
      return { sentiment: { score: 0, label: 'neutral' } };
    }

    // Simple rule-based sentiment analysis
    // In production, this would use ML models
    const positiveWords = [
      'excellent',
      'great',
      'good',
      'amazing',
      'outstanding',
      'fantastic',
    ];
    const negativeWords = [
      'poor',
      'bad',
      'terrible',
      'awful',
      'horrible',
      'disappointing',
    ];

    const words = this._tokenize(text).map(w => w.toLowerCase());
    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });

    const total = positiveScore + negativeScore;
    if (total === 0) return { score: 0, label: 'neutral' };

    const confidence = Math.min(total / words.length, 1);
    const score = positiveScore > negativeScore ? confidence : -confidence;
    const label = positiveScore > negativeScore ? 'positive' : 'negative';

    return { score, label };
  }

  /**
   * Normalize text for processing
   * @param {string} text - Raw text
   * @returns {string} Normalized text
   */
  _normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s.+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenize text into words
   * @param {string} text - Text to tokenize
   * @returns {Array<string>} Array of words
   */
  _tokenize(text) {
    return text.split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * Calculate confidence score for extracted skill
   * @param {string} skill - Skill name
   * @param {string} context - Full text context
   * @returns {number} Confidence score (0-1)
   */
  _calculateSkillConfidence(skill, context) {
    // Simple confidence calculation based on context
    const skillLength = skill.length;
    const contextLength = context.length;
    const frequency = (context.match(new RegExp(skill, 'gi')) || []).length;

    // Longer skills in technical contexts are more confident
    let confidence = Math.min(skillLength / 20, 0.8);

    // Frequency bonus
    confidence += Math.min(frequency * 0.1, 0.2);

    return Math.min(confidence, 1);
  }

  /**
   * Categorize a skill
   * @param {string} skill - Skill name
   * @returns {string} Skill category
   */
  _categorizeSkill(skill) {
    const categories = {
      programming: [
        'javascript',
        'python',
        'java',
        'c++',
        'c#',
        'php',
        'ruby',
        'go',
      ],
      framework: [
        'react',
        'angular',
        'vue',
        'node.js',
        'express',
        'django',
        'flask',
        'spring',
      ],
      database: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis'],
      cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
      ai: ['machine learning', 'deep learning', 'ai', 'nlp', 'computer vision'],
      soft: ['communication', 'leadership', 'teamwork', 'problem solving'],
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.some(s => skill.includes(s))) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Extract experience requirements from text (returns array)
   * @param {string} text - Normalized text
   * @returns {Array<string>} Experience requirements
   */
  _extractExperienceRequirements(text) {
    const experiencePatterns = [
      /(\d+)\s*(?:to|\-)\s*(\d+)\s*years?/i,
      /(\d+)\s*\+\s*years?/i,
      /(\d+)\s*years?\s*experience/i,
    ];

    const requirements = [];
    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          requirements.push(`${match[1]}-${match[2]} years`);
        } else {
          requirements.push(`${match[1]}+ years`);
        }
      }
    }

    return requirements;
  }

  /**
   * Extract education requirements from text (returns array)
   * @param {string} text - Normalized text
   * @returns {Array<string>} Education requirements
   */
  _extractEducationRequirements(text) {
    const educationLevels = [
      'bachelor',
      'master',
      'phd',
      'doctorate',
      'associate',
      'diploma',
      'certificate',
    ];

    const requirements = [];
    for (const level of educationLevels) {
      if (text.includes(level)) {
        requirements.push(level);
      }
    }

    return requirements;
  }

  /**
   * Extract responsibilities from job description
   * @param {string} text - Normalized text
   * @returns {Array<string>} List of responsibilities
   */
  _extractResponsibilities(text) {
    // Simple extraction based on common patterns
    const responsibilityIndicators = [
      'responsibilities',
      'duties',
      'role',
      'tasks',
    ];

    for (const indicator of responsibilityIndicators) {
      const index = text.indexOf(indicator);
      if (index !== -1) {
        const section = text.substring(index, index + 500);
        return section
          .split(/[.;]/)
          .filter(s => s.trim().length > 10)
          .slice(0, 5);
      }
    }

    return [];
  }

  /**
   * Extract qualifications from job description
   * @param {string} text - Normalized text
   * @returns {Array<string>} List of qualifications
   */
  _extractQualifications(text) {
    const qualificationIndicators = [
      'requirements',
      'qualifications',
      'skills',
      'experience',
    ];

    for (const indicator of qualificationIndicators) {
      const index = text.indexOf(indicator);
      if (index !== -1) {
        const section = text.substring(index, index + 500);
        return section
          .split(/[.;]/)
          .filter(s => s.trim().length > 10)
          .slice(0, 5);
      }
    }

    return [];
  }

  /**
   * Extract name from CV text
   * @param {string} text - Raw CV text with line breaks
   * @returns {string|null} Extracted name
   */
  _extractName(text) {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Simple heuristic: first line that's not an email or phone
    for (const line of lines.slice(0, 3)) {
      if (!line.includes('@') && !/\d{3}/.test(line)) {
        // Check if it looks like a name (2-3 words, capitalized)
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          return line;
        }
      }
    }

    return null;
  }

  /**
   * Extract experience strings from CV
   * @param {string} text - Normalized text
   * @returns {Array<string>} Experience strings
   */
  _extractExperienceStrings(text) {
    const experience = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const yearMatch = line.match(/\b(\d+\s*years?)\b/i);
      if (yearMatch) {
        experience.push(yearMatch[1]);
      }
      const dateMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
      if (dateMatch) {
        experience.push(dateMatch[1]);
      }
    }

    return experience.slice(0, 3);
  }

  /**
   * Extract education strings from CV
   * @param {string} text - Normalized text
   * @returns {Array<string>} Education strings
   */
  _extractEducationStrings(text) {
    const education = [];
    const educationKeywords = [
      'bachelor',
      'master',
      'phd',
      'university',
      'college',
      'degree',
      'computer science',
      'engineering',
      'business',
    ];

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const matchedKeywords = educationKeywords.filter(keyword =>
        line.toLowerCase().includes(keyword)
      );
      matchedKeywords.forEach(keyword => {
        if (!education.includes(keyword)) {
          education.push(keyword);
        }
      });
    }

    return education.slice(0, 2);
  }

  /**
   * Normalize skill name for consistent matching
   * @param {string} skillName - Raw skill name
   * @returns {string} Normalized skill name
   */
  _normalizeSkillName(skillName) {
    if (!skillName || typeof skillName !== 'string') return '';
    return skillName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Extract basic entities from Vietnamese text
   * @param {string} text - Normalized text
   * @returns {Array<Object>} Basic entities
   */
  _extractBasicEntities(text) {
    // Basic entity extraction for Vietnamese
    const entities = [];

    // Simple name extraction (Vietnamese names often have 2-3 parts)
    const nameMatch = text.match(
      /([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ][a-zàáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]+(?:\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ][a-zàáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]+){1,2})/
    );
    if (nameMatch) {
      entities.push({
        type: 'PERSON',
        value: nameMatch[1],
        confidence: 0.7,
      });
    }

    return entities;
  }

  /**
   * Extract basic experience from Vietnamese text
   * @param {string} text - Normalized text
   * @returns {Array<Object>} Basic experience info
   */
  _extractBasicExperience(text) {
    const experience = [];

    // Look for year patterns in Vietnamese
    const yearPatterns = [
      /(\d+)\s*năm\s*kinh\s*nghiệm/g,
      /(\d+)\s*year[s]?\s*experience/g,
      /kinh\s*nghiệm\s*(\d+)\s*năm/g,
    ];

    for (const pattern of yearPatterns) {
      const match = text.match(pattern);
      if (match) {
        experience.push({
          years: parseInt(match[1]),
          type: 'professional',
          confidence: 0.6,
        });
        break;
      }
    }

    return experience;
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @returns {string} Language code
   */
  _detectLanguage(text) {
    // Simple language detection
    const vietnameseChars =
      /[àáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
    const hasVietnamese = vietnameseChars.test(text);

    if (hasVietnamese) {
      return 'vi';
    }

    return 'en';
  }
}

module.exports = NLPEngine;
