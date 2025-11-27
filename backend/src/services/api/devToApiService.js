/**
 * Dev.to API Service
 * 
 * Fetch articles from Dev.to community
 * NO API KEY REQUIRED! 100% free and unlimited
 * 
 * API: https://dev.to/api/articles
 */

const axios = require('axios');
const { logger } = require('../../utils/logger');

class DevToApiService {
  constructor() {
    this.baseUrl = 'https://dev.to/api';
    this.isAvailable = true; // Always available, no API key needed
    logger.info('Dev.to API Service initialized (no API key required)');
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return this.isAvailable;
  }

  /**
   * Search articles by skill/tag
   * 
   * @param {string} skill - Skill name (e.g., "React")
   * @param {string} difficulty - Difficulty level (optional)
   * @param {number} maxResults - Maximum results (default: 10)
   * @returns {Promise<Array>} Array of article resources
   */
  async searchArticles(skill, difficulty = 'beginner', maxResults = 10) {
    if (!this.isServiceAvailable()) {
      return [];
    }

    try {
      // Build tag from skill name
      const tag = this._normalizeTag(skill);

      // Search articles by tag
      const response = await axios.get(`${this.baseUrl}/articles`, {
        params: {
          tag: tag,
          per_page: Math.min(maxResults, 30), // Dev.to API limit: 30 per page
          top: 30, // Get top articles (most popular)
        },
      });

      if (!response.data || response.data.length === 0) {
        logger.info(`No Dev.to articles found for tag: ${tag}`);
        return [];
      }

      // Transform to resource format
      const articles = response.data.map(article => ({
        type: 'article',
        title: article.title,
        url: article.url,
        provider: 'Dev.to',
        author: article.user.name,
        description: article.description || article.title,
        publishedAt: article.published_at,
        readingTime: article.reading_time_minutes,
        tags: article.tag_list || [],
        reactions: article.public_reactions_count || 0,
        comments: article.comments_count || 0,
        difficulty: this._estimateDifficulty(article, difficulty),
        isFree: true,
        estimatedCost: 0,
        rating: this._calculateRating(article),
        duration: `${article.reading_time_minutes || 10} minutes`,
        recencyScore: this._calculateRecencyScore(article.published_at),
      }));

      logger.info(`Found ${articles.length} Dev.to articles for: ${skill}`);
      return articles;

    } catch (error) {
      logger.error('Dev.to API error:', error.message);
      return [];
    }
  }

  /**
   * Get article by ID
   * 
   * @param {number} articleId - Article ID
   * @returns {Promise<Object|null>} Article object or null
   */
  async getArticle(articleId) {
    try {
      const response = await axios.get(`${this.baseUrl}/articles/${articleId}`);
      return response.data;
    } catch (error) {
      logger.error('Dev.to API get article error:', error.message);
      return null;
    }
  }

  /**
   * Normalize skill name to Dev.to tag format
   * 
   * @param {string} skill - Skill name
   * @returns {string} Normalized tag
   */
  _normalizeTag(skill) {
    if (!skill) return 'programming';

    // Convert to lowercase and handle special cases
    const normalized = skill.toLowerCase().trim();

    // Map common skills to Dev.to tags
    const tagMap = {
      'react': 'react',
      'reactjs': 'react',
      'node.js': 'node',
      'nodejs': 'node',
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'python': 'python',
      'java': 'java',
      'c++': 'cpp',
      'cpp': 'cpp',
      'go': 'go',
      'golang': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'vue': 'vue',
      'vuejs': 'vue',
      'angular': 'angular',
      'docker': 'docker',
      'kubernetes': 'kubernetes',
      'aws': 'aws',
      'mongodb': 'mongodb',
      'postgresql': 'postgresql',
      'redis': 'redis',
    };

    return tagMap[normalized] || normalized.replace(/[^a-z0-9]/g, '');
  }

  /**
   * Estimate difficulty from article
   * 
   * @param {Object} article - Article object
   * @param {string} defaultDifficulty - Default difficulty
   * @returns {string} Difficulty level
   */
  _estimateDifficulty(article, defaultDifficulty) {
    // Check tags for difficulty hints
    const tags = (article.tag_list || []).map(t => t.toLowerCase());
    
    if (tags.some(t => t.includes('beginner') || t.includes('tutorial'))) {
      return 'beginner';
    }
    if (tags.some(t => t.includes('advanced') || t.includes('expert'))) {
      return 'advanced';
    }
    if (tags.some(t => t.includes('intermediate'))) {
      return 'intermediate';
    }

    return defaultDifficulty;
  }

  /**
   * Calculate rating from article metrics
   * 
   * @param {Object} article - Article object
   * @returns {number} Rating (0-5)
   */
  _calculateRating(article) {
    const reactions = article.public_reactions_count || 0;
    const comments = article.comments_count || 0;
    const readingTime = article.reading_time_minutes || 10;

    // Base rating from reactions (more reactions = better)
    let rating = 4.0; // Default

    if (reactions >= 100) rating = 5.0;
    else if (reactions >= 50) rating = 4.5;
    else if (reactions >= 20) rating = 4.0;
    else if (reactions >= 10) rating = 3.5;
    else rating = 3.0;

    // Bonus for engagement (comments)
    if (comments >= 10) rating += 0.2;
    else if (comments >= 5) rating += 0.1;

    // Bonus for longer articles (more comprehensive)
    if (readingTime >= 15) rating += 0.1;

    return Math.min(5.0, Math.max(3.0, rating));
  }

  /**
   * Calculate recency score
   * 
   * @param {string} publishedAt - ISO date string
   * @returns {number} Recency score (0-1)
   */
  _calculateRecencyScore(publishedAt) {
    if (!publishedAt) return 0.5;

    try {
      const publishedDate = new Date(publishedAt);
      const now = new Date();
      const monthsOld = (now - publishedDate) / (30 * 24 * 60 * 60 * 1000);

      // Articles decay slower than videos (content is more evergreen)
      if (monthsOld <= 24) return 1.0;  // < 2 years: excellent
      if (monthsOld <= 36) return 0.8;  // 2-3 years: good
      if (monthsOld <= 48) return 0.6;  // 3-4 years: OK
      return 0.4;                        // > 4 years: outdated
    } catch (error) {
      return 0.5;
    }
  }
}

module.exports = new DevToApiService();

