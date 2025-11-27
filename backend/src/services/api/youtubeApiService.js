/**
 * YouTube Data API v3 Service
 * 
 * Fetch real video resources with metadata:
 * - Title, URL, Channel
 * - View count, Like count
 * - Duration, Published date
 * - Thumbnail
 * 
 * Quota: 10,000 units/day (free)
 * - Search: 100 units
 * - Video details: 1 unit
 */

const { google } = require('googleapis');
const { logger } = require('../../utils/logger');

class YouTubeApiService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.youtube = null;
    this.isAvailable = false;

    if (this.apiKey) {
      try {
        this.youtube = google.youtube('v3');
        this.isAvailable = true;
        logger.info('YouTube API Service initialized');
      } catch (error) {
        logger.warn('Failed to initialize YouTube API Service', error.message);
      }
    } else {
      logger.warn('YOUTUBE_API_KEY not set, YouTube API Service disabled');
    }
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return this.isAvailable && !!this.apiKey;
  }

  /**
   * Search for videos by skill and difficulty
   * 
   * @param {string} skill - Skill name (e.g., "React")
   * @param {string} difficulty - Difficulty level (beginner/intermediate/advanced)
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @returns {Promise<Array>} Array of video resources
   */
  async searchVideos(skill, difficulty = 'beginner', maxResults = 10, options = {}) {
    if (!this.isServiceAvailable()) {
      logger.warn('YouTube API not available, skipping video search');
      return [];
    }

    try {
      // Build search query
      const query = this._buildSearchQuery(skill, difficulty);

      // Search for videos
      const { language, regionCode } = options || {};
      const searchParams = {
        key: this.apiKey,
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: Math.min(maxResults, 50), // YouTube API limit
        order: 'relevance',
        videoDuration: 'long', // > 20 minutes (better for courses)
        videoDefinition: 'high', // HD videos
      };

      if (language) {
        searchParams.relevanceLanguage = language;
        searchParams.hl = language;
      }

      if (regionCode || language) {
        searchParams.regionCode = regionCode || this._mapLanguageToRegion(language);
      }

      const searchResponse = await this.youtube.search.list(searchParams);

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        logger.info(`No YouTube videos found for: ${query}`);
        return [];
      }

      // Get video IDs for detailed stats
      const videoIds = searchResponse.data.items.map(item => item.id.videoId);

      // Get detailed video information (stats, duration)
      const videoDetails = await this._getVideoDetails(videoIds);

      // Combine search results with detailed stats
      const videos = searchResponse.data.items.map((item, index) => {
        const details = videoDetails[index] || {};
        
        return {
          type: 'video',
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          provider: 'YouTube',
          channel: item.snippet.channelTitle,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url,
          difficulty: difficulty,
          duration: details.duration || 'Unknown',
          viewCount: details.viewCount || 0,
          likeCount: details.likeCount || 0,
          isFree: true,
          estimatedCost: 0,
          rating: this._calculateRating(details.viewCount, details.likeCount),
          // Metadata for credibility scoring
          lastUpdated: item.snippet.publishedAt,
          recencyScore: this._calculateRecencyScore(item.snippet.publishedAt),
        };
      });

      logger.info(`Found ${videos.length} YouTube videos for: ${skill} (${difficulty})`);
      return videos;

    } catch (error) {
      logger.error('YouTube API search error:', error.message);
      
      // Handle quota exceeded
      if (error.message.includes('quota') || error.message.includes('quotaExceeded')) {
        logger.error('YouTube API quota exceeded');
        this.isAvailable = false; // Disable service temporarily
      }
      
      return [];
    }
  }

  /**
   * Get detailed video information (stats, duration)
   * 
   * @param {Array<string>} videoIds - Array of video IDs
   * @returns {Promise<Array>} Array of video details
   */
  async _getVideoDetails(videoIds) {
    if (!this.isServiceAvailable() || videoIds.length === 0) {
      return [];
    }

    try {
      const response = await this.youtube.videos.list({
        key: this.apiKey,
        part: 'statistics,contentDetails',
        id: videoIds.join(','),
      });

      return response.data.items.map(item => ({
        viewCount: parseInt(item.statistics.viewCount || 0),
        likeCount: parseInt(item.statistics.likeCount || 0),
        duration: this._parseDuration(item.contentDetails.duration),
      }));

    } catch (error) {
      logger.error('YouTube API video details error:', error.message);
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
      beginner: 'beginner tutorial introduction',
      intermediate: 'intermediate course advanced',
      advanced: 'advanced expert master',
    };

    const keywords = difficultyKeywords[difficulty] || 'tutorial course';
    return `${skill} ${keywords} full course`;
  }

  /**
   * Parse ISO 8601 duration to human-readable format
   * 
   * @param {string} isoDuration - ISO 8601 duration (e.g., "PT1H30M15S")
   * @returns {string} Human-readable duration (e.g., "1 hour 30 minutes")
   */
  _parseDuration(isoDuration) {
    if (!isoDuration) return 'Unknown';

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown';

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 && hours === 0 && minutes === 0) {
      parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(' ') : 'Unknown';
  }

  /**
   * Calculate rating based on view count and like count
   * Simple heuristic: like/view ratio * 5
   * 
   * @param {number} viewCount - Number of views
   * @param {number} likeCount - Number of likes
   * @returns {number} Rating (0-5)
   */
  _calculateRating(viewCount, likeCount) {
    if (!viewCount || viewCount === 0) return 4.0; // Default rating

    const likeRatio = likeCount / viewCount;
    // Typical like ratio: 0.02-0.05 (2-5%)
    // Scale to 4.0-5.0 rating
    const rating = 4.0 + (likeRatio * 20); // Scale factor
    return Math.min(5.0, Math.max(4.0, rating));
  }

  /**
   * Calculate recency score based on published date
   * 
   * @param {string} publishedAt - ISO date string
   * @returns {number} Recency score (0-1)
   */
  _calculateRecencyScore(publishedAt) {
    if (!publishedAt) return 0.5;

    const publishedDate = new Date(publishedAt);
    const now = new Date();
    const monthsOld = (now - publishedDate) / (30 * 24 * 60 * 60 * 1000);

    // Fast-decay for tech content
    if (monthsOld <= 12) return 1.0;  // < 1 year: excellent
    if (monthsOld <= 24) return 0.7;  // 1-2 years: OK
    if (monthsOld <= 36) return 0.5;  // 2-3 years: outdated
    return 0.3;                        // > 3 years: very outdated
  }

  _mapLanguageToRegion(language) {
    if (!language || typeof language !== 'string') {
      return 'US';
    }
    const map = {
      vi: 'VN',
      en: 'US',
      ja: 'JP',
      ko: 'KR',
      zh: 'SG',
    };
    return map[language.toLowerCase()] || 'US';
  }
}

module.exports = new YouTubeApiService();

