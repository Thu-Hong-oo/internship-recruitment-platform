/**
 * Google Custom Search API Service
 * 
 * Search for learning resources using Google Custom Search API
 * Useful as backup when other APIs don't return enough results
 * 
 * Quota: 100 queries/day (free tier)
 */

const axios = require('axios');
const { logger } = require('../../utils/logger');

class GoogleSearchService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.isAvailable = false;

    if (this.apiKey && this.searchEngineId) {
      this.isAvailable = true;
      this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
      logger.info('Google Custom Search API Service initialized');
    } else {
      logger.warn('Google Search API credentials not set, service disabled');
    }
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return this.isAvailable && !!this.apiKey && !!this.searchEngineId;
  }

  /**
   * Search for resources by skill
   * 
   * @param {string} skill - Skill name (e.g., "React")
   * @param {string} difficulty - Difficulty level
   * @param {string} site - Optional site filter (e.g., "udemy.com")
   * @param {number} maxResults - Maximum results (default: 10)
   * @returns {Promise<Array>} Array of search results
   */
  async searchResources(skill, difficulty = 'beginner', site = null, maxResults = 10, language = null) {
    if (!this.isServiceAvailable()) {
      logger.warn('Google Search API not available, skipping search');
      return [];
    }

    try {
      // Build search query
      let query = `learn ${skill} ${difficulty} tutorial course`;
      if (site) {
        query += ` site:${site}`;
      }

      const params = {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: Math.min(maxResults, 10), // Google API limit: 10 per request
      };

      if (language) {
        params.lr = this._formatLanguage(language);
      }

      const response = await axios.get(this.baseUrl, { params });

      if (!response.data.items || response.data.items.length === 0) {
        logger.info(`No Google search results for: ${query}`);
        return [];
      }

      // Transform results to resource format
      const resources = response.data.items.map(item => ({
        type: this._determineResourceType(item.link),
        title: item.title,
        url: item.link,
        provider: this._extractProvider(item.link),
        description: item.snippet,
        displayLink: item.displayLink,
        difficulty: difficulty,
        isFree: this._isLikelyFree(item.link),
        estimatedCost: this._estimateCost(item.link),
        rating: 4.0, // Default, no rating from search
        source: 'Google Search',
      }));

      logger.info(`Found ${resources.length} Google search results for: ${skill}`);
      return resources;

    } catch (error) {
      logger.error('Google Search API error:', error.message);

      // Handle quota exceeded
      if (error.response?.status === 403 || error.message.includes('quota')) {
        logger.error('Google Search API quota exceeded');
        this.isAvailable = false;
      }

      return [];
    }
  }

  /**
   * Search for resources on specific sites
   * 
   * @param {string} skill - Skill name
   * @param {string} site - Site to search (e.g., "udemy.com", "coursera.org")
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Array>} Array of resources
   */
  async searchOnSite(skill, site, maxResults = 10) {
    return this.searchResources(skill, 'beginner', site, maxResults);
  }

  /**
   * Determine resource type from URL
   * 
   * @param {string} url - URL
   * @returns {string} Resource type
   */
  _determineResourceType(url) {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'video';
    }
    if (urlLower.includes('udemy.com') || urlLower.includes('coursera.org') || urlLower.includes('edx.org')) {
      return 'course';
    }
    if (urlLower.includes('docs.') || urlLower.includes('documentation')) {
      return 'documentation';
    }
    if (urlLower.includes('github.com') || urlLower.includes('gitlab.com')) {
      return 'project';
    }

    return 'article'; // Default
  }

  /**
   * Extract provider name from URL
   * 
   * @param {string} url - URL
   * @returns {string} Provider name
   */
  _extractProvider(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');

      const providerMap = {
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'udemy.com': 'Udemy',
        'coursera.org': 'Coursera',
        'edx.org': 'edX',
        'freecodecamp.org': 'freeCodeCamp',
        'github.com': 'GitHub',
        'medium.com': 'Medium',
        'dev.to': 'Dev.to',
      };

      return providerMap[hostname] || hostname.split('.')[0];
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Check if resource is likely free
   * 
   * @param {string} url - URL
   * @returns {boolean} True if likely free
   */
  _isLikelyFree(url) {
    const urlLower = url.toLowerCase();
    
    // Free platforms
    const freePlatforms = [
      'youtube.com',
      'youtu.be',
      'github.com',
      'freecodecamp.org',
      'medium.com',
      'dev.to',
      'docs.',
      'documentation',
    ];

    return freePlatforms.some(platform => urlLower.includes(platform));
  }

  /**
   * Estimate cost based on URL
   * 
   * @param {string} url - URL
   * @returns {number} Estimated cost
   */
  _estimateCost(url) {
    const urlLower = url.toLowerCase();

    if (this._isLikelyFree(url)) {
      return 0;
    }

    // Paid platforms - estimate
    if (urlLower.includes('udemy.com')) {
      return 19.99; // Typical Udemy price
    }
    if (urlLower.includes('coursera.org')) {
      return 49.0; // Typical Coursera price
    }
    if (urlLower.includes('edx.org')) {
      return 99.0; // Typical edX price
    }

    return 0; // Unknown, assume free
  }

  _formatLanguage(language) {
    if (!language || typeof language !== 'string') {
      return null;
    }
    const normalized = language.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    return `lang_${normalized}`;
  }
}

module.exports = new GoogleSearchService();

