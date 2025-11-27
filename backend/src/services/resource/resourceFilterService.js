/**
 * Resource Filter Service
 * 
 * Filtering và scoring resources dựa trên:
 * - Recency (độ mới)
 * - Source Authority (độ uy tín nguồn)
 * - Accuracy (độ chính xác từ ratings/reviews)
 * - CRAAP Test criteria
 */

const { logger } = require('../../utils/logger');

class ResourceFilterService {
  constructor() {
    // Source tier mapping
    this.sourceTiers = {
      // Tier 1: Official sources (1.0)
      tier1: {
        domains: [
          'reactjs.org',
          'react.dev',
          'developer.mozilla.org',
          'nodejs.org',
          'docs.python.org',
          'angular.io',
          'vuejs.org',
          'coursera.org',
          'edx.org',
        ],
        score: 1.0,
      },
      // Tier 2: Popular educational platforms (0.85)
      tier2: {
        domains: [
          'udemy.com',
          'pluralsight.com',
          'linkedin.com/learning',
          'codecademy.com',
        ],
        score: 0.85,
      },
      // Tier 3: Community platforms (0.70)
      tier3: {
        domains: [
          'medium.com',
          'dev.to',
          'freecodecamp.org',
          'youtube.com',
        ],
        score: 0.70,
      },
      // Tier 4: Other sources (0.50)
      tier4: {
        domains: [],
        score: 0.50,
      },
    };
  }

  /**
   * Get source tier and score from URL
   * 
   * @param {string} url - Resource URL
   * @returns {Object} { tier, score }
   */
  getSourceTier(url) {
    if (!url) return { tier: 'tier4', score: 0.50 };

    const urlLower = url.toLowerCase();

    // Check each tier
    for (const [tierName, tierData] of Object.entries(this.sourceTiers)) {
      if (tierData.domains.some(domain => urlLower.includes(domain))) {
        return { tier: tierName, score: tierData.score };
      }
    }

    // Default to tier 4
    return { tier: 'tier4', score: 0.50 };
  }

  /**
   * Calculate recency score based on published/updated date
   * Fast-decay for tech content (React, Node.js change quickly)
   * 
   * @param {string} publishedDate - ISO date string
   * @param {string} updatedDate - ISO date string (optional)
   * @returns {number} Recency score (0-1)
   */
  getRecencyScore(publishedDate, updatedDate = null) {
    const lastUpdate = updatedDate || publishedDate;
    
    if (!lastUpdate) {
      return 0.5; // Unknown date, neutral score
    }

    try {
      const lastUpdateDate = new Date(lastUpdate);
      const now = new Date();
      const monthsOld = (now - lastUpdateDate) / (30 * 24 * 60 * 60 * 1000);

      // Fast-decay for tech content
      if (monthsOld <= 12) return 1.0;  // < 1 year: excellent
      if (monthsOld <= 24) return 0.7;  // 1-2 years: OK
      if (monthsOld <= 36) return 0.5;  // 2-3 years: outdated
      return 0.3;                        // > 3 years: very outdated

    } catch (error) {
      logger.warn('Error calculating recency score:', error.message);
      return 0.5; // Default neutral score
    }
  }

  /**
   * Calculate accuracy score from rating and review count
   * Combines rating quality and social proof
   * 
   * @param {number} rating - Rating (0-5)
   * @param {number} reviewCount - Number of reviews
   * @returns {number} Accuracy score (0-1)
   */
  getAccuracyScore(rating, reviewCount) {
    // Normalize rating to 0-1 (50% weight)
    const ratingScore = (rating || 0) / 5.0;

    // Review count score (50% weight)
    let countScore = 0;
    if (reviewCount >= 10000) countScore = 1.0;
    else if (reviewCount >= 5000) countScore = 0.9;
    else if (reviewCount >= 1000) countScore = 0.8;
    else if (reviewCount >= 500) countScore = 0.7;
    else if (reviewCount >= 100) countScore = 0.6;
    else if (reviewCount >= 50) countScore = 0.5;
    else countScore = 0.4; // Low review count

    // Weighted combination
    return (ratingScore * 0.5) + (countScore * 0.5);
  }

  /**
   * Calculate credibility score using CRAAP test criteria
   * CRAAP: Currency, Relevance, Authority, Accuracy, Purpose
   * 
   * @param {Object} resource - Resource object
   * @returns {number} Credibility score (0-1)
   */
  calculateCredibilityScore(resource) {
    // Currency (25%): Recency
    const recencyScore = resource.recencyScore !== undefined
      ? resource.recencyScore
      : this.getRecencyScore(resource.publishedAt, resource.lastUpdated);

    // Authority (30%): Source tier
    const sourceTier = this.getSourceTier(resource.url);
    const authorityScore = sourceTier.score;

    // Accuracy (25%): Ratings and reviews
    const accuracyScore = this.getAccuracyScore(
      resource.rating,
      resource.reviewCount || resource.students || resource.viewCount || 0
    );

    // Relevance (20%): How well it matches the query
    // This is usually calculated elsewhere, default to 0.8
    const relevanceScore = resource.relevanceScore || 0.8;

    // Weighted combination
    const credibility = (
      recencyScore * 0.25 +
      authorityScore * 0.30 +
      accuracyScore * 0.25 +
      relevanceScore * 0.20
    );

    return Math.min(1.0, Math.max(0.0, credibility));
  }

  /**
   * Filter resources by minimum credibility score
   * 
   * @param {Array} resources - Array of resources
   * @param {number} minCredibility - Minimum credibility score (default: 0.6)
   * @returns {Array} Filtered resources
   */
  filterByCredibility(resources, minCredibility = 0.6) {
    return resources.filter(resource => {
      const credibility = this.calculateCredibilityScore(resource);
      return credibility >= minCredibility;
    });
  }

  /**
   * Filter resources by constraints
   * 
   * @param {Array} resources - Array of resources
   * @param {Object} constraints - Constraints object
   * @param {string} constraints.budget - Budget constraint ('free', '< 50', etc.)
   * @param {number} constraints.maxHours - Maximum hours
   * @param {string} constraints.language - Language preference
   * @returns {Array} Filtered resources
   */
  filterByConstraints(resources, constraints = {}) {
    let filtered = [...resources];

    // Budget filter
    if (constraints.budget === 'free') {
      filtered = filtered.filter(r => r.isFree === true);
    } else if (constraints.budget === '< 50') {
      filtered = filtered.filter(r => 
        r.isFree === true || (r.estimatedCost && r.estimatedCost < 50)
      );
    }

    // Time filter
    if (constraints.maxHours) {
      filtered = filtered.filter(r => {
        const duration = this._parseDuration(r.duration);
        return duration <= constraints.maxHours;
      });
    }

    // Language filter (if resource has language field)
    if (constraints.language) {
      filtered = filtered.filter(r => {
        // Default to English if not specified
        return !r.language || r.language === constraints.language;
      });
    }

    return filtered;
  }

  /**
   * Parse duration string to hours
   * 
   * @param {string} duration - Duration string (e.g., "40 hours", "3 months")
   * @returns {number} Duration in hours
   */
  _parseDuration(duration) {
    if (!duration || typeof duration !== 'string') {
      return 0;
    }

    const match = duration.match(/(\d+)\s*(hour|hours|month|months|week|weeks|day|days)/i);
    if (!match) {
      return 0;
    }

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.includes('hour')) return value;
    if (unit.includes('day')) return value * 8; // 8 hours/day
    if (unit.includes('week')) return value * 40; // 40 hours/week
    if (unit.includes('month')) return value * 30 * 8; // 8 hours/day, 30 days/month

    return 0;
  }
}

module.exports = new ResourceFilterService();

