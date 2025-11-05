const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../../../config/logger');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * ExperienceEnhancerService - Handles enhancement of experience descriptions and professional writing
 * Infrastructure Layer Service following Clean Architecture
 */
class ExperienceEnhancerService {
  constructor() {
    this.actionVerbs = [
      'developed',
      'implemented',
      'designed',
      'created',
      'built',
      'managed',
      'led',
      'coordinated',
      'optimized',
      'improved',
      'enhanced',
      'achieved',
      'delivered',
      'launched',
      'maintained',
      'supported',
      'collaborated',
      'analyzed',
      'solved',
      'integrated',
      'deployed',
      'automated',
      'streamlined',
    ];

    this.quantifiers = [
      'increased',
      'reduced',
      'improved',
      'enhanced',
      'boosted',
      'decreased',
      'optimized',
      'streamlined',
      'accelerated',
      'expanded',
      'scaled',
    ];
  }

  /**
   * Enhance experience description with professional language
   * @param {Object} experienceData - Experience data to enhance
   * @returns {Promise<Object>} Enhanced experience data
   */
  async enhanceExperienceDescription(experienceData) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Enhance this work experience description to be more professional and impactful:

ORIGINAL:
${experienceData.description || 'No description provided'}

POSITION: ${experienceData.position || ''}
COMPANY: ${experienceData.company || ''}
DURATION: ${experienceData.startDate || ''} - ${experienceData.endDate || ''}

Requirements:
1. Start each bullet with strong action verbs
2. Include quantifiable achievements where possible
3. Use professional language and industry terms
4. Highlight impact and results
5. Keep it concise but comprehensive
6. Tiếng Việt professional

Return JSON:
{
  "enhanced": "Enhanced professional description",
  "original": "${experienceData.description || ''}",
  "improvements": [
    "Added action verbs",
    "Included metrics",
    "Improved clarity"
  ],
  "suggestions": [
    "Consider adding specific metrics",
    "Highlight leadership aspects"
  ],
  "keywords": ["leadership", "development", "optimization"],
  "readability_score": 85
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this._normalizeEnhancementResult(parsed);
      }

      return this._enhanceExperienceBasic(experienceData);
    } catch (error) {
      logger.error('Experience enhancement error:', error);
      return this._enhanceExperienceBasic(experienceData);
    }
  }

  /**
   * Basic experience enhancement without AI
   * @private
   */
  _enhanceExperienceBasic(experienceData) {
    const original = experienceData.description || '';
    let enhanced = original;

    // Add action verbs if missing
    if (!this._hasActionVerbs(original)) {
      enhanced = this._addActionVerbs(enhanced);
    }

    // Try to quantify achievements
    enhanced = this._addQuantifiers(enhanced);

    return {
      enhanced,
      original,
      improvements: [
        'Added professional action verbs',
        'Improved sentence structure',
        'Enhanced clarity',
      ],
      suggestions: [
        'Consider adding specific metrics and results',
        'Use industry-specific terminology',
        'Highlight your unique contributions',
      ],
      keywords: this._extractKeywords(enhanced),
      readability_score: 75,
    };
  }

  /**
   * Check if description has action verbs
   * @private
   */
  _hasActionVerbs(text) {
    const lowerText = text.toLowerCase();
    return this.actionVerbs.some(verb => lowerText.includes(verb));
  }

  /**
   * Add action verbs to description
   * @private
   */
  _addActionVerbs(text) {
    // Simple enhancement - in real implementation, this would be more sophisticated
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    const enhanced = sentences.map(sentence => {
      const trimmed = sentence.trim();
      if (trimmed && !this._hasActionVerbs(trimmed)) {
        // Add a random action verb at the beginning
        const randomVerb =
          this.actionVerbs[Math.floor(Math.random() * this.actionVerbs.length)];
        return `${
          randomVerb.charAt(0).toUpperCase() + randomVerb.slice(1)
        } ${trimmed.toLowerCase()}`;
      }
      return trimmed;
    });

    return enhanced.join('. ') + (enhanced.length > 0 ? '.' : '');
  }

  /**
   * Add quantifiers to achievements
   * @private
   */
  _addQuantifiers(text) {
    // Look for common patterns that could be quantified
    let enhanced = text;

    // Replace generic improvements with quantified ones
    enhanced = enhanced.replace(
      /improved (.+?)([.!?]|$)/gi,
      'improved $1 by 20%$2'
    );

    enhanced = enhanced.replace(
      /increased (.+?)([.!?]|$)/gi,
      'increased $1 by 25%$2'
    );

    enhanced = enhanced.replace(
      /reduced (.+?)([.!?]|$)/gi,
      'reduced $1 by 30%$2'
    );

    return enhanced;
  }

  /**
   * Extract keywords from enhanced text
   * @private
   */
  _extractKeywords(text) {
    const keywords = new Set();
    const lowerText = text.toLowerCase();

    // Add action verbs that appear
    this.actionVerbs.forEach(verb => {
      if (lowerText.includes(verb)) {
        keywords.add(verb);
      }
    });

    // Add common tech keywords
    const techKeywords = [
      'development',
      'programming',
      'software',
      'web',
      'mobile',
      'database',
      'api',
      'frontend',
      'backend',
    ];
    techKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.add(keyword);
      }
    });

    return Array.from(keywords);
  }

  /**
   * Enhance multiple experience entries
   * @param {Array} experiences - Array of experience objects
   * @returns {Promise<Array>} Enhanced experiences
   */
  async enhanceMultipleExperiences(experiences) {
    const enhancedExperiences = [];

    for (const experience of experiences) {
      try {
        const enhanced = await this.enhanceExperienceDescription(experience);
        enhancedExperiences.push({
          ...experience,
          description: enhanced.enhanced,
          enhancement_metadata: {
            original_description: enhanced.original,
            improvements: enhanced.improvements,
            suggestions: enhanced.suggestions,
            keywords: enhanced.keywords,
            readability_score: enhanced.readability_score,
          },
        });
      } catch (error) {
        logger.error(
          `Failed to enhance experience for ${experience.position}:`,
          error
        );
        enhancedExperiences.push(experience); // Return original if enhancement fails
      }
    }

    return enhancedExperiences;
  }

  /**
   * Generate achievement suggestions based on role
   * @param {string} position - Job position
   * @param {string} industry - Industry
   * @returns {Promise<Array>} Achievement suggestions
   */
  async generateAchievementSuggestions(position, industry) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Generate specific achievement suggestions for this role:
Position: ${position}
Industry: ${industry}

Provide 5-7 quantifiable achievements that someone in this role might have accomplished.
Each achievement should:
1. Start with an action verb
2. Include specific metrics/numbers
3. Show impact or results
4. Be realistic for the role

Return JSON array:
[
  "Increased application performance by 40% through code optimization",
  "Led a team of 5 developers to deliver project 2 weeks ahead of schedule",
  "Reduced bug rate by 60% implementing automated testing",
  "Improved user satisfaction scores from 3.2 to 4.8 out of 5"
]
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this._generateBasicAchievements(position);
    } catch (error) {
      logger.error('Achievement suggestions error:', error);
      return this._generateBasicAchievements(position);
    }
  }

  /**
   * Generate basic achievement suggestions
   * @private
   */
  _generateBasicAchievements(position) {
    const positionLower = position.toLowerCase();

    if (
      positionLower.includes('developer') ||
      positionLower.includes('engineer')
    ) {
      return [
        'Developed and deployed 3 major features improving user engagement by 25%',
        'Optimized database queries reducing response time by 40%',
        'Implemented automated testing reducing bug rate by 60%',
        'Collaborated with cross-functional teams to deliver projects on time',
        'Mentored junior developers improving team productivity',
      ];
    } else if (
      positionLower.includes('manager') ||
      positionLower.includes('lead')
    ) {
      return [
        'Led a team of 8 members achieving 95% project delivery rate',
        'Implemented agile methodologies increasing team velocity by 30%',
        'Reduced project costs by 20% through process optimization',
        'Improved customer satisfaction scores from 3.5 to 4.7 out of 5',
        'Established best practices resulting in 40% faster onboarding',
      ];
    } else {
      return [
        'Successfully completed assigned tasks meeting all deadlines',
        'Collaborated effectively with team members on various projects',
        'Contributed to process improvements within the department',
        'Received positive feedback from supervisors and colleagues',
        'Demonstrated strong work ethic and commitment to quality',
      ];
    }
  }

  /**
   * Analyze description quality
   * @param {string} description - Description to analyze
   * @returns {Object} Quality analysis
   */
  analyzeDescriptionQuality(description) {
    const analysis = {
      score: 0,
      strengths: [],
      weaknesses: [],
      suggestions: [],
    };

    // Check length
    if (description.length < 50) {
      analysis.weaknesses.push('Description is too short');
      analysis.suggestions.push(
        'Add more specific details about your accomplishments'
      );
    } else if (description.length > 500) {
      analysis.weaknesses.push('Description is too long');
      analysis.suggestions.push(
        'Consider breaking into more focused bullet points'
      );
    } else {
      analysis.strengths.push('Good length for description');
      analysis.score += 20;
    }

    // Check for action verbs
    if (this._hasActionVerbs(description)) {
      analysis.strengths.push('Uses strong action verbs');
      analysis.score += 25;
    } else {
      analysis.weaknesses.push('Missing action verbs');
      analysis.suggestions.push(
        'Start sentences with action verbs like "Developed", "Implemented", "Led"'
      );
    }

    // Check for quantifiers
    const hasQuantifiers = this.quantifiers.some(quantifier =>
      description.toLowerCase().includes(quantifier)
    );

    if (hasQuantifiers) {
      analysis.strengths.push('Includes quantifiable achievements');
      analysis.score += 25;
    } else {
      analysis.weaknesses.push('Lacks specific metrics');
      analysis.suggestions.push(
        'Add numbers and percentages to show impact (e.g., "increased by 20%")'
      );
    }

    // Check for keywords
    const keywordCount = this._extractKeywords(description).length;
    if (keywordCount > 3) {
      analysis.strengths.push('Contains relevant keywords');
      analysis.score += 20;
    } else {
      analysis.weaknesses.push('Few industry keywords');
      analysis.suggestions.push(
        'Include more relevant technical terms and skills'
      );
    }

    // Check professionalism
    const informalWords = [
      'kinda',
      'sorta',
      'like',
      'really',
      'very',
      'stuff',
      'things',
    ];
    const hasInformal = informalWords.some(word =>
      description.toLowerCase().includes(word)
    );

    if (!hasInformal) {
      analysis.strengths.push('Professional tone maintained');
      analysis.score += 10;
    } else {
      analysis.weaknesses.push('Contains informal language');
      analysis.suggestions.push('Use more professional language');
    }

    return analysis;
  }

  /**
   * Normalize enhancement result
   * @private
   */
  _normalizeEnhancementResult(result) {
    return {
      enhanced: result.enhanced || '',
      original: result.original || '',
      improvements: result.improvements || [],
      suggestions: result.suggestions || [],
      keywords: result.keywords || [],
      readability_score: result.readability_score || 75,
    };
  }

  /**
   * Get action verbs list
   * @returns {string[]} Action verbs
   */
  getActionVerbs() {
    return [...this.actionVerbs];
  }

  /**
   * Get quantifier words list
   * @returns {string[]} Quantifiers
   */
  getQuantifiers() {
    return [...this.quantifiers];
  }
}

module.exports = new ExperienceEnhancerService();
