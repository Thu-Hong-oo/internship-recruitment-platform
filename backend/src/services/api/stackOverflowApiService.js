/**
 * Stack Overflow API Service
 * 
 * Fetch Q&A, articles, and best practices from Stack Overflow
 * FREE API, 10,000 requests/day
 * 
 * API: https://api.stackexchange.com/2.3/
 */

const axios = require('axios');
const { logger } = require('../../utils/logger');

class StackOverflowApiService {
  constructor() {
    this.baseUrl = 'https://api.stackexchange.com/2.3';
    this.apiKey = process.env.STACKOVERFLOW_API_KEY; // Optional, increases quota
    this.isAvailable = true; // Always available, API key is optional
    logger.info('Stack Overflow API Service initialized');
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return this.isAvailable;
  }

  /**
   * Build request params with API key if available
   */
  _getParams(additionalParams = {}) {
    const params = {
      site: 'stackoverflow',
      filter: 'default', // Get full data
      ...additionalParams,
    };

    if (this.apiKey) {
      params.key = this.apiKey;
    }

    return params;
  }

  /**
   * Search for questions/articles by skill
   * 
   * @param {string} skill - Skill name (e.g., "React")
   * @param {string} difficulty - Difficulty level (optional)
   * @param {number} maxResults - Maximum results (default: 10)
   * @returns {Promise<Array>} Array of resource objects
   */
  async searchQuestions(skill, difficulty = 'beginner', maxResults = 10) {
    if (!this.isServiceAvailable()) {
      return [];
    }

    try {
      // Build search query
      const query = this._buildSearchQuery(skill, difficulty);

      const response = await axios.get(`${this.baseUrl}/search/advanced`, {
        params: this._getParams({
          q: query,
          sort: 'votes', // Sort by votes (most popular)
          order: 'desc',
          pagesize: Math.min(maxResults, 100), // Stack Overflow limit: 100 per page
          answers: 1, // Only questions with at least 1 answer
          accepted: 'True', // Only questions with accepted answers
        }),
      });

      if (!response.data.items || response.data.items.length === 0) {
        logger.info(`No Stack Overflow questions found for: ${query}`);
        return [];
      }

      // Transform to resource format
      const resources = response.data.items.map(item => ({
        type: 'article', // Stack Overflow Q&A as articles
        title: item.title,
        url: item.link,
        provider: 'Stack Overflow',
        author: item.owner?.display_name || 'Anonymous',
        description: this._extractDescription(item),
        publishedAt: new Date(item.creation_date * 1000).toISOString(),
        viewCount: item.view_count || 0,
        score: item.score || 0,
        answers: item.answer_count || 0,
        acceptedAnswer: item.accepted_answer_id ? true : false,
        tags: item.tags || [],
        difficulty: this._estimateDifficulty(item, difficulty),
        isFree: true,
        estimatedCost: 0,
        rating: this._calculateRating(item),
        duration: `${Math.ceil((item.answer_count || 1) * 5)} minutes`, // Estimate reading time
        recencyScore: this._calculateRecencyScore(item.creation_date),
      }));

      logger.info(`Found ${resources.length} Stack Overflow questions for: ${skill}`);
      return resources;

    } catch (error) {
      logger.error('Stack Overflow API error:', error.message);
      
      // Handle rate limit
      if (error.response?.status === 400 && error.response.data?.error_name === 'throttle_violation') {
        logger.error('Stack Overflow API rate limit exceeded');
      }
      
      return [];
    }
  }

  /**
   * Get top questions by tag
   * 
   * @param {string} skill - Skill name
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Array>} Array of resources
   */
  async getTopQuestionsByTag(skill, maxResults = 10) {
    try {
      const tag = this._normalizeTag(skill);

      const response = await axios.get(`${this.baseUrl}/questions`, {
        params: this._getParams({
          tagged: tag,
          sort: 'votes',
          order: 'desc',
          pagesize: Math.min(maxResults, 100),
        }),
      });

      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      return response.data.items.map(item => ({
        type: 'article',
        title: item.title,
        url: item.link,
        provider: 'Stack Overflow',
        score: item.score || 0,
        answers: item.answer_count || 0,
        tags: item.tags || [],
        isFree: true,
        rating: this._calculateRating(item),
      }));

    } catch (error) {
      logger.error('Stack Overflow API get top questions error:', error.message);
      return [];
    }
  }

  /**
   * Build search query from skill and difficulty
   * 
   * @param {string} skill - Skill name
   * @param {string} difficulty - Difficulty level
   * @returns {string} Search query
   */
  _buildSearchQuery(skill, difficulty) {
    const difficultyKeywords = {
      beginner: 'tutorial beginner guide',
      intermediate: 'best practices advanced',
      advanced: 'expert optimization',
    };

    const keywords = difficultyKeywords[difficulty] || 'tutorial';
    return `${skill} ${keywords}`;
  }

  /**
   * Normalize skill name to Stack Overflow tag format
   * 
   * @param {string} skill - Skill name
   * @returns {string} Normalized tag
   */
  _normalizeTag(skill) {
    if (!skill) return 'programming';

    const normalized = skill.toLowerCase().trim();

    const tagMap = {
      'react': 'reactjs',
      'reactjs': 'reactjs',
      'node.js': 'node.js',
      'nodejs': 'node.js',
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'python': 'python',
      'java': 'java',
      'c++': 'c++',
      'cpp': 'c++',
      'go': 'go',
      'golang': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'vue': 'vue.js',
      'vuejs': 'vue.js',
      'angular': 'angular',
      'docker': 'docker',
      'kubernetes': 'kubernetes',
      'aws': 'amazon-web-services',
      'mongodb': 'mongodb',
      'postgresql': 'postgresql',
      'redis': 'redis',
    };

    return tagMap[normalized] || normalized.replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Extract description from question body (first 200 chars)
   * 
   * @param {Object} item - Question item
   * @returns {string} Description
   */
  _extractDescription(item) {
    // Stack Overflow API doesn't return body in search results by default
    // Would need to fetch individual questions for full body
    return item.title || 'Stack Overflow question';
  }

  /**
   * Estimate difficulty from question
   * 
   * @param {Object} item - Question item
   * @param {string} defaultDifficulty - Default difficulty
   * @returns {string} Difficulty level
   */
  _estimateDifficulty(item, defaultDifficulty) {
    // Check tags for difficulty hints
    const tags = (item.tags || []).map(t => t.toLowerCase());
    
    if (tags.some(t => t.includes('beginner') || t.includes('tutorial'))) {
      return 'beginner';
    }
    if (tags.some(t => t.includes('advanced') || t.includes('expert'))) {
      return 'advanced';
    }

    return defaultDifficulty;
  }

  /**
   * Calculate rating from question metrics
   * 
   * @param {Object} item - Question item
   * @returns {number} Rating (0-5)
   */
  _calculateRating(item) {
    const score = item.score || 0;
    const answers = item.answer_count || 0;
    const views = item.view_count || 0;
    const hasAccepted = item.accepted_answer_id ? true : false;

    // Base rating from score
    let rating = 4.0; // Default

    if (score >= 100) rating = 5.0;
    else if (score >= 50) rating = 4.5;
    else if (score >= 20) rating = 4.0;
    else if (score >= 10) rating = 3.5;
    else rating = 3.0;

    // Bonus for accepted answer
    if (hasAccepted) rating += 0.2;

    // Bonus for multiple answers (more perspectives)
    if (answers >= 5) rating += 0.1;

    // Bonus for high views (popular question)
    if (views >= 10000) rating += 0.1;

    return Math.min(5.0, Math.max(3.0, rating));
  }

  /**
   * Calculate recency score
   * 
   * @param {number} creationDate - Unix timestamp
   * @returns {number} Recency score (0-1)
   */
  _calculateRecencyScore(creationDate) {
    if (!creationDate) return 0.5;

    try {
      const publishedDate = new Date(creationDate * 1000);
      const now = new Date();
      const monthsOld = (now - publishedDate) / (30 * 24 * 60 * 60 * 1000);

      // Q&A content can be more evergreen
      if (monthsOld <= 36) return 1.0;  // < 3 years: excellent
      if (monthsOld <= 60) return 0.8;  // 3-5 years: good
      if (monthsOld <= 84) return 0.6;  // 5-7 years: OK
      return 0.4;                        // > 7 years: outdated
    } catch (error) {
      return 0.5;
    }
  }
}

module.exports = new StackOverflowApiService();

