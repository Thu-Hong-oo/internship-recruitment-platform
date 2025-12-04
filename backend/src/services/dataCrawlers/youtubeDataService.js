const YouTubeSR = require("youtube-sr").default;
const { logger } = require('../../utils/logger');

/**
 * YouTube Data Service (Quota-Free)
 * Uses youtube-sr for scraping YouTube search results without API quota limits
 * 
 * @description 100% free, no API key required, no quota limits
 * @author Thu-Hong-oo
 * @date 2025-12-04
 */
class YouTubeDataService {
  constructor() {
    this.initialized = true;
    logger.info('✅ YouTube Data Service initialized (quota-free youtube-sr)');
  }

  /**
   * Initialize YouTube service (no-op for youtube-sr)
   */
  initialize() {
    // No initialization needed for youtube-sr
  }

  /**
   * Search for videos on YouTube using youtube-sr (no API key required)
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 7)
   * @returns {Promise<Array>} Array of video objects
   */
  async searchVideos(query, maxResults = 7) {
    try {
      // Fix: Add context for ambiguous skill names
      let searchQuery = query;
      if (query.toLowerCase() === 'sketch' || query.toLowerCase().includes('sketch tutorial')) {
        searchQuery = 'sketch app UI design tutorial';
        logger.info(`🔍 Refined query from "${query}" to "${searchQuery}"`);
      } else {
        logger.info(`🔍 Searching YouTube for: "${query}"`);
      }

      const results = await YouTubeSR.search(searchQuery, {
        limit: maxResults,
        type: "video",
        safeSearch: false
      });

      if (!results || results.length === 0) {
        logger.warn(`⚠️ No videos found for: ${query}`);
        return [];
      }

      const videos = results.map(video => ({
        id: video.id,
        title: video.title || "YouTube Tutorial",
        description: video.description || "",
        thumbnail: video.thumbnail?.url || "",
        channelTitle: video.channel?.name || "Unknown Channel",
        publishedAt: video.uploadedAt || "",
        url: `https://www.youtube.com/watch?v=${video.id}`,
        duration: video.duration ? `${Math.floor(video.duration / 60000)} phút` : "N/A",
        views: video.views?.toLocaleString() || "N/A",
        source: "youtube",
        
        // MongoDB schema required fields
        type: "video",  // Required by LearningRoadmap schema
        provider: video.channel?.name || "YouTube",
        difficulty: "beginner",
        isFree: true,
        language: "en",
        
        // Credibility and metadata for RAGService filtering
        credibility: 0.75,  // Default credibility for YouTube videos (75%)
        popularity: video.views || 0,
        rating: 4.0,  // Default rating (4/5 stars)
        metadata: {
          publishedAt: video.uploadedAt || new Date().toISOString(),
          channelTitle: video.channel?.name || "Unknown Channel",
          views: video.views || 0
        }
      }));

      logger.info(`✅ Found ${videos.length} YouTube videos for: ${query}`);
      return videos;
    } catch (error) {
      logger.error(`❌ YouTubeSR search failed for: ${query}`, error.message);
      return [];
    }
  }

  /**
   * Search for videos from specific trusted channels
   * @param {string} skill - Skill name
   * @param {string} industry - Industry category
   * @returns {Promise<Array>} Array of video objects from trusted channels
   */
  async searchInTrustedChannels(skill, industry = 'technology') {
    try {
      // Fix for "sketch" confusion: Add context based on skill name
      let query = `${skill} tutorial beginner`;
      
      // Special case: Sketch app (UI design tool) vs drawing sketch
      if (skill.toLowerCase() === 'sketch') {
        query = 'sketch app UI design tutorial beginner';
        logger.info(`🎯 Refined query for Sketch app: ${query}`);
      } else {
        logger.info(`🎯 Searching for: ${query}`);
      }

      const results = await this.searchVideos(query, 8);
      logger.info(`✅ Found ${results.length} videos from search`);
      
      return results;
    } catch (error) {
      logger.error(`❌ Trusted channel search failed:`, error);
      return [];
    }
  }

  /**
   * Get videos from trusted channels (alias for backward compatibility)
   * @param {string} skill - Skill name
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of video objects
   */
  async getVideosFromTrustedChannels(skill, options = {}) {
    return this.searchInTrustedChannels(skill, options.industry);
  }
}

module.exports = new YouTubeDataService();
