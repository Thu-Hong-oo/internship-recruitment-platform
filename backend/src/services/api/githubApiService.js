/**
 * GitHub API Service
 * 
 * Fetch curated resources from GitHub Awesome Lists:
 * - Parse awesome-{skill} repositories
 * - Extract links from README.md
 * - Get repository metadata (stars, description)
 * 
 * Quota:
 * - Without token: 60 requests/hour
 * - With token: 5,000 requests/hour
 */

const axios = require('axios');
const { logger } = require('../../utils/logger');

class GitHubApiService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN?.trim(); // Optional, increases rate limit
    this.isAvailable = true; // Always available (public API)
    
    if (this.token) {
      logger.info('GitHub API Service initialized with token');
    } else {
      logger.info('GitHub API Service initialized (no token, limited rate)');
    }
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return this.isAvailable;
  }

  /**
   * Check if we have an auth token (helps decide rate limits)
   */
  hasAuthToken() {
    return Boolean(this.token);
  }

  /**
   * Get headers for API requests
   */
  _getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    return headers;
  }

  /**
   * Search for awesome-{skill} repositories
   * 
   * @param {string} skill - Skill name (e.g., "React")
   * @param {number} maxRepos - Maximum number of repos to check (default: 3)
   * @returns {Promise<Array>} Array of resources from awesome lists
   */
  async getAwesomeList(skill, maxRepos = 3) {
    if (!this.isServiceAvailable()) {
      return [];
    }

    try {
      const repoLimit = this.hasAuthToken() ? maxRepos : Math.min(1, maxRepos);
      // Search for awesome-{skill} repositories
      const query = `awesome-${skill.toLowerCase()} in:name topic:awesome-list`;
      
      const response = await axios.get(`${this.baseUrl}/search/repositories`, {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: repoLimit,
        },
        headers: this._getHeaders(),
      });

      if (!response.data.items || response.data.items.length === 0) {
        logger.info(`No awesome lists found for: ${skill}`);
        return [];
      }

      const repos = response.data.items.slice(0, repoLimit);
      logger.info(`Found ${repos.length} awesome lists for: ${skill}`);

      // Get resources from each repository's README
      const allResources = [];
      
      for (const repo of repos) {
        try {
          const resources = await this._getResourcesFromRepo(repo);
          allResources.push(...resources);
        } catch (error) {
          logger.warn(`Failed to get resources from ${repo.full_name}:`, error.message);
          // Continue with other repos
        }
      }

      logger.info(`Extracted ${allResources.length} resources from awesome lists for: ${skill}`);
      return allResources;

    } catch (error) {
      logger.error('GitHub API search error:', error.message);
      
      // Handle rate limit
      if (error.response?.status === 403 || error.message.includes('rate limit')) {
        logger.error('GitHub API rate limit exceeded');
        // Could implement retry logic here
      }
      
      return [];
    }
  }

  /**
   * Get resources from a repository's README
   * 
   * @param {Object} repo - Repository object from GitHub API
   * @returns {Promise<Array>} Array of resources
   */
  async _getResourcesFromRepo(repo) {
    try {
      // Get README content
      const readmeContent = await this._getReadmeContent(repo.full_name);
      
      if (!readmeContent) {
        return [];
      }

      // Parse markdown links
      const resources = this._parseMarkdownLinks(readmeContent, repo);

      return resources;

    } catch (error) {
      logger.warn(`Failed to get README from ${repo.full_name}:`, error.message);
      return [];
    }
  }

  /**
   * Get README content from repository
   * 
   * @param {string} repoFullName - Repository full name (owner/repo)
   * @returns {Promise<string|null>} README content or null
   */
  async _getReadmeContent(repoFullName) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${repoFullName}/readme`,
        {
          headers: this._getHeaders(),
        }
      );

      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return content;

    } catch (error) {
      if (error.response?.status === 404) {
        logger.debug(`README not found for ${repoFullName}`);
      } else {
        logger.warn(`Failed to get README for ${repoFullName}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Parse markdown links from README content
   * 
   * @param {string} markdown - Markdown content
   * @param {Object} repo - Repository object
   * @returns {Array} Array of resources
   */
  _parseMarkdownLinks(markdown, repo) {
    const resources = [];
    
    // Match markdown links: [text](url)
    const linkRegex = /(!?)\[([^\]]+)\]\(([^\)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const [, imageMarker, title, url] = match;
      if (imageMarker === '!') {
        continue; // Skip badges/images
      }
      
      // Only include HTTP/HTTPS links (skip relative links, anchors, etc.)
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        // Skip common non-resource links
        if (this._isValidResourceLink(url, title)) {
          resources.push({
            type: this._determineResourceType(url),
            title: title.trim(),
            url: url.trim(),
            provider: this._extractProvider(url),
            source: `GitHub Awesome List: ${repo.full_name}`,
            repository: repo.full_name,
            stars: repo.stargazers_count,
            isFree: true, // Most awesome list resources are free
            estimatedCost: 0,
            rating: this._calculateRatingFromStars(repo.stargazers_count),
            difficulty: 'intermediate', // Default, could be improved with NLP
          });
        }
      }
    }

    return resources;
  }

  /**
   * Check if URL is a valid resource link
   * 
   * @param {string} url - URL to check
   * @returns {boolean} True if valid resource
   */
  _isValidResourceLink(url, title = '') {
    const cleanedTitle = title.trim().toLowerCase();
    if (!cleanedTitle || cleanedTitle.length < 3) {
      return false;
    }

    if (this._isImageUrl(url)) {
      return false;
    }

    const blockedTitlePatterns = [
      'build status',
      'badge',
      'contributing',
      'contribution',
      'license',
      'awesome',
      'table of contents',
      'code of conduct',
      'sponsor',
      'support me',
      'roadmap',
      'pull request',
    ];

    if (blockedTitlePatterns.some((pattern) => cleanedTitle.includes(pattern))) {
      return false;
    }

    // Skip common non-resource links
    const skipPatterns = [
      /github\.com\/.*\/issues/i,
      /github\.com\/.*\/pull/i,
      /github\.com\/.*\/releases/i,
      /github\.com\/.*\/wiki/i,
      /mailto:/i,
      /^#/, // Anchors
    ];

    return !skipPatterns.some(pattern => pattern.test(url));
  }

  _isImageUrl(url) {
    return /\.(png|jpe?g|gif|svg|webp)$/i.test(url);
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
    if (urlLower.includes('github.com') || urlLower.includes('gitlab.com')) {
      return 'project';
    }
    if (urlLower.includes('docs.') || urlLower.includes('documentation')) {
      return 'documentation';
    }
    if (urlLower.includes('medium.com') || urlLower.includes('dev.to') || urlLower.includes('blog')) {
      return 'article';
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

      // Map common domains to provider names
      const providerMap = {
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'udemy.com': 'Udemy',
        'coursera.org': 'Coursera',
        'edx.org': 'edX',
        'github.com': 'GitHub',
        'gitlab.com': 'GitLab',
        'medium.com': 'Medium',
        'dev.to': 'Dev.to',
        'freecodecamp.org': 'freeCodeCamp',
      };

      return providerMap[hostname] || hostname.split('.')[0];
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Calculate rating based on repository stars
   * 
   * @param {number} stars - Number of stars
   * @returns {number} Rating (0-5)
   */
  _calculateRatingFromStars(stars) {
    if (!stars || stars === 0) return 4.0; // Default

    // Scale stars to rating
    // 10k+ stars = 5.0
    // 1k+ stars = 4.5
    // 100+ stars = 4.0
    if (stars >= 10000) return 5.0;
    if (stars >= 1000) return 4.5;
    if (stars >= 100) return 4.0;
    return 3.5;
  }
}

module.exports = new GitHubApiService();

