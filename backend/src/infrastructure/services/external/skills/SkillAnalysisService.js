const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../../config/logger');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * SkillAnalysisService - Handles skill extraction and analysis from CV text
 * Infrastructure Layer Service following Clean Architecture
 */
class SkillAnalysisService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;

    // Predefined skill categories
    this.skillCategories = {
      technical: [
        'javascript',
        'python',
        'java',
        'c++',
        'c#',
        'php',
        'ruby',
        'go',
        'rust',
        'react',
        'angular',
        'vue',
        'node.js',
        'express',
        'django',
        'spring',
        'html',
        'css',
        'sass',
        'bootstrap',
        'tailwind',
        'mysql',
        'postgresql',
        'mongodb',
        'redis',
        'elasticsearch',
        'aws',
        'azure',
        'gcp',
        'docker',
        'kubernetes',
        'jenkins',
        'git',
      ],
      soft: [
        'communication',
        'leadership',
        'teamwork',
        'problem solving',
        'time management',
        'adaptability',
        'creativity',
        'critical thinking',
      ],
      tools: [
        'vscode',
        'intellij',
        'eclipse',
        'postman',
        'figma',
        'photoshop',
        'jira',
        'trello',
        'slack',
        'zoom',
      ],
    };
  }

  /**
   * Extract skills from CV text using AI
   * @param {string} cvText - Raw CV text
   * @returns {Promise<Object>} Extracted skills data
   */
  async extractSkills(cvText) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Extract skills from this CV text. Categorize them into technical, soft, and tools skills.
Also identify skill levels and provide confidence scores.

CV TEXT:
${cvText}

Return JSON format:
{
  "technical": [
    {
      "name": "JavaScript",
      "level": "intermediate",
      "confidence": 0.9,
      "context": "Used in multiple projects"
    }
  ],
  "soft": [
    {
      "name": "Communication",
      "level": "advanced",
      "confidence": 0.8,
      "context": "Led team presentations"
    }
  ],
  "tools": [
    {
      "name": "Git",
      "level": "advanced",
      "confidence": 0.95,
      "context": "Version control expert"
    }
  ],
  "other": [
    {
      "name": "Project Management",
      "level": "beginner",
      "confidence": 0.6,
      "context": "Assisted in project coordination"
    }
  ],
  "summary": {
    "totalSkills": 15,
    "topSkills": ["JavaScript", "React", "Node.js"],
    "skillGaps": ["AWS", "Docker"]
  }
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this._normalizeSkills(parsed);
      }

      // Fallback to basic extraction
      return this._extractSkillsBasic(cvText);
    } catch (error) {
      logger.error('Skill extraction error:', error);
      return this._extractSkillsBasic(cvText);
    }
  }

  /**
   * Basic skill extraction using pattern matching
   * @private
   */
  _extractSkillsBasic(cvText) {
    const text = cvText.toLowerCase();
    const foundSkills = {
      technical: [],
      soft: [],
      tools: [],
      other: [],
    };

    // Extract technical skills
    this.skillCategories.technical.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.technical.push({
          name: skill,
          level: 'intermediate',
          confidence: 0.7,
          context: 'Mentioned in CV',
        });
      }
    });

    // Extract soft skills
    this.skillCategories.soft.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.soft.push({
          name: skill,
          level: 'intermediate',
          confidence: 0.6,
          context: 'Mentioned in CV',
        });
      }
    });

    // Extract tools
    this.skillCategories.tools.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.tools.push({
          name: skill,
          level: 'intermediate',
          confidence: 0.8,
          context: 'Mentioned in CV',
        });
      }
    });

    return {
      ...foundSkills,
      summary: {
        totalSkills:
          foundSkills.technical.length +
          foundSkills.soft.length +
          foundSkills.tools.length,
        topSkills: foundSkills.technical.slice(0, 3).map(s => s.name),
        skillGaps: [],
      },
    };
  }

  /**
   * Normalize and validate extracted skills
   * @private
   */
  _normalizeSkills(skillsData) {
    const normalized = {
      technical: [],
      soft: [],
      tools: [],
      other: [],
      summary: skillsData.summary || {},
    };

    // Normalize technical skills
    if (skillsData.technical && Array.isArray(skillsData.technical)) {
      normalized.technical = skillsData.technical.map(skill => ({
        name: skill.name || '',
        level: this._normalizeSkillLevel(skill.level),
        confidence: skill.confidence || 0.5,
        context: skill.context || '',
      }));
    }

    // Normalize soft skills
    if (skillsData.soft && Array.isArray(skillsData.soft)) {
      normalized.soft = skillsData.soft.map(skill => ({
        name: skill.name || '',
        level: this._normalizeSkillLevel(skill.level),
        confidence: skill.confidence || 0.5,
        context: skill.context || '',
      }));
    }

    // Normalize tools
    if (skillsData.tools && Array.isArray(skillsData.tools)) {
      normalized.tools = skillsData.tools.map(skill => ({
        name: skill.name || '',
        level: this._normalizeSkillLevel(skill.level),
        confidence: skill.confidence || 0.5,
        context: skill.context || '',
      }));
    }

    // Normalize other skills
    if (skillsData.other && Array.isArray(skillsData.other)) {
      normalized.other = skillsData.other.map(skill => ({
        name: skill.name || '',
        level: this._normalizeSkillLevel(skill.level),
        confidence: skill.confidence || 0.5,
        context: skill.context || '',
      }));
    }

    return normalized;
  }

  /**
   * Normalize skill level to standard values
   * @private
   */
  _normalizeSkillLevel(level) {
    if (!level) return 'beginner';

    const levelMap = {
      beginner: ['beginner', 'novice', 'basic', 'entry'],
      intermediate: ['intermediate', 'medium', 'mid', 'average'],
      advanced: ['advanced', 'expert', 'senior', 'proficient'],
      expert: ['expert', 'master', 'guru', 'specialist'],
    };

    const normalizedLevel = level.toLowerCase();
    for (const [standard, variations] of Object.entries(levelMap)) {
      if (variations.some(v => normalizedLevel.includes(v))) {
        return standard;
      }
    }

    return 'intermediate'; // default
  }

  /**
   * Analyze skill proficiency based on context
   * @param {string} skillName - Name of the skill
   * @param {string} context - Usage context from CV
   * @returns {string} Proficiency level
   */
  analyzeSkillProficiency(skillName, context) {
    const contextLower = context.toLowerCase();

    // Expert indicators
    if (
      contextLower.includes('expert') ||
      contextLower.includes('senior') ||
      contextLower.includes('lead') ||
      contextLower.includes('architect') ||
      contextLower.includes('5+ years')
    ) {
      return 'expert';
    }

    // Advanced indicators
    if (
      contextLower.includes('advanced') ||
      contextLower.includes('proficient') ||
      contextLower.includes('3-5 years') ||
      contextLower.includes('production') ||
      contextLower.includes('enterprise')
    ) {
      return 'advanced';
    }

    // Intermediate indicators
    if (
      contextLower.includes('intermediate') ||
      contextLower.includes('1-3 years') ||
      contextLower.includes('projects') ||
      contextLower.includes('development')
    ) {
      return 'intermediate';
    }

    return 'beginner';
  }

  /**
   * Get skill categories
   * @returns {Object} Skill categories
   */
  getSkillCategories() {
    return { ...this.skillCategories };
  }
}

module.exports = new SkillAnalysisService();
