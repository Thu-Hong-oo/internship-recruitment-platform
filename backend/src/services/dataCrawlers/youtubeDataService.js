const { google } = require('googleapis');
const { logger } = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * YouTube Data Crawler Service
 * Fetches real educational videos from YouTube for learning roadmaps
 * 
 * @description Provides verifiable, credible video resources from trusted channels
 * @author Thu-Hong-oo
 * @date 2025-12-01
 */
class YouTubeDataService {
  constructor() {
    this.youtube = null;
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.initialized = false;

    // Trusted educational channels - MULTI-INDUSTRY
    this.trustedChannels = {
      // Technology & Programming
      technology: [
        'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp.org
        'UCW5YeuERMmlnqo4oq8vwUpg', // Net Ninja
        'UCmXVXfidLZQkppLPaATcHag', // Corey Schafer
        'UC29ju8bIPH5as8OGnQzwJyA', // Traversy Media
        'UCsBjURrPoezykLs9EqgamOA', // Fireship
      ],
      
      // Marketing & Business
      marketing: [
        'UCkRfmx2447SDj6hNnFTr9Xw', // Neil Patel
        'UCGDyKKCk3GUr1Zco_1Bn8lQ', // HubSpot Marketing
        'UC_x5XG1OV2P6uZZ5FSM9Ttw', // Google Digital Garage
        'UCMphBs2o9oWlD3fXw2EdgfQ', // Social Media Examiner
      ],
      
      // Design
      design: [
        'UCVyRiMvfUNMA1UPlDPzG5Ow', // DesignCourse
        'UC-b3c7kxa5vU-bnmaROgvog', // The Futur
        'UCxSITxL2JbF229OGCqjTNQA', // Charli Marie TV
        'UCYzQTLsE5VD93-gv8RBLDhw', // Flux Academy
      ],
      
      // Business & Management
      business: [
        'UCEBb1b_L6zDS3xTUrIALZOw', // MIT OpenCourseWare
        'UC_w2nrw-sL8rgbh-_Xzh5Ow', // Stanford Graduate School of Business
        'UCzCpyMnlzPYLJlCX-WTpZeA', // Harvard Business School
      ],
      
      // Accounting & Finance
      accounting: [
        'UC8Lc_0402fROIcvlKzBUfMA', // Edspira
        'UCUTc94mjt-qBb3UXx3fMBxA', // Accounting Stuff
        'UC-IUzyNc06YnJlGRcYqZ_zw', // Corporate Finance Institute
      ],
    };
  }

  /**
   * Initialize YouTube API client
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      if (!this.apiKey) {
        logger.error('❌ YOUTUBE_API_KEY not found in environment variables');
        return false;
      }

      this.youtube = google.youtube({
        version: 'v3',
        auth: this.apiKey,
      });

      this.initialized = true;
      logger.info('✅ YouTube Data Service initialized');
      return true;
    } catch (error) {
      logger.error('❌ YouTube API initialization failed:', error);
      return false;
    }
  }

  /**
   * Search educational videos by skill/topic
   * @param {string} skill - Skill to search for (e.g., "React", "Python", "Machine Learning")
   * @param {Object} options - Search options
   */
  async searchVideos(skill, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        maxResults = 10,
        difficulty = 'beginner', // beginner, intermediate, advanced
        minDuration = 300, // 5 minutes in seconds
        maxDuration = 3600, // 60 minutes
      } = options;

      // Build search query
      const searchQuery = `${skill} tutorial ${difficulty}`;

      logger.info(`🔍 Searching YouTube for: "${searchQuery}"`);

      // Search videos
      const searchResponse = await this.youtube.search.list({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoDuration: 'medium', // 4-20 minutes
        videoDefinition: 'high',
        relevanceLanguage: 'en',
        maxResults: maxResults * 2, // Get extra for filtering
        order: 'relevance',
      });

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        logger.warn(`⚠️ No videos found for: ${searchQuery}`);
        return [];
      }

      // Get video details (statistics, contentDetails)
      const videoIds = searchResponse.data.items.map(item => item.id.videoId);
      const videoDetailsResponse = await this.youtube.videos.list({
        part: 'statistics,contentDetails,snippet',
        id: videoIds.join(','),
      });

      // Format and filter results
      const videos = [];
      for (const video of videoDetailsResponse.data.items) {
        const duration = this.parseDuration(video.contentDetails.duration);
        const viewCount = parseInt(video.statistics.viewCount || 0);
        const likeCount = parseInt(video.statistics.likeCount || 0);
        const commentCount = parseInt(video.statistics.commentCount || 0);

        // Filter by duration and quality
        if (duration < minDuration || duration > maxDuration) {
          continue;
        }

        if (viewCount < 1000) {
          // Skip low-quality videos
          continue;
        }

        // Calculate rating (likes ratio)
        const rating = likeCount / (viewCount + 1) * 100;

        // Calculate credibility score (0-1)
        const credibility = this.calculateCredibility({
          viewCount,
          likeCount,
          commentCount,
          channelId: video.snippet.channelId,
        });

        videos.push({
          id: `youtube_${video.id}_${uuidv4()}`,
          title: video.snippet.title,
          description: video.snippet.description.substring(0, 500), // Truncate long descriptions
          url: `https://www.youtube.com/watch?v=${video.id}`,
          type: 'video',
          skill: skill,
          difficulty: difficulty,
          duration: Math.floor(duration / 60), // Convert to minutes
          source: 'youtube',
          provider: video.snippet.channelTitle,
          credibility: credibility,
          rating: Math.min(rating * 10, 5), // Convert to 1-5 scale
          popularity: viewCount,
          metadata: {
            videoId: video.id,
            channelId: video.snippet.channelId,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails.high.url,
            views: viewCount,
            likes: likeCount,
            comments: commentCount,
          },
        });
      }

      // Sort by credibility and popularity
      videos.sort((a, b) => {
        const scoreA = a.credibility * 0.6 + (a.popularity / 1000000) * 0.4;
        const scoreB = b.credibility * 0.6 + (b.popularity / 1000000) * 0.4;
        return scoreB - scoreA;
      });

      logger.info(`✅ Found ${videos.length} high-quality videos for: ${skill}`);
      return videos.slice(0, maxResults);
    } catch (error) {
      logger.error(`❌ YouTube search failed for: ${skill}`, error);
      return [];
    }
  }

  /**
   * Detect industry from skill name
   */
  detectIndustry(skill) {
    const lowerSkill = skill.toLowerCase();
    if (lowerSkill.includes('marketing') || lowerSkill.includes('seo') || lowerSkill.includes('ads')) return 'marketing';
    if (lowerSkill.includes('design') || lowerSkill.includes('photoshop') || lowerSkill.includes('figma')) return 'design';
    if (lowerSkill.includes('account') || lowerSkill.includes('finance') || lowerSkill.includes('tax')) return 'accounting';
    if (lowerSkill.includes('business') || lowerSkill.includes('management') || lowerSkill.includes('sales')) return 'business';
    return 'technology';
  }

  /**
   * Get videos from trusted educational channels
   * @param {string} skill - Skill to search for
   * @param {Object} options - Search options
   */
  async getVideosFromTrustedChannels(skill, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const { maxResults = 5, difficulty = 'beginner' } = options;
      const allVideos = [];

      // Detect industry and get relevant channels
      const industry = this.detectIndustry(skill);
      const channels = this.trustedChannels[industry] || this.trustedChannels.technology;

      logger.info(`🎯 Searching in ${industry} channels for: ${skill}`);

      // Search in each trusted channel
      for (const channelId of channels.slice(0, 5)) {
        // Limit to 5 channels to save quota
        try {
          const searchQuery = `${skill} ${difficulty}`;

          const searchResponse = await this.youtube.search.list({
            part: 'snippet',
            channelId: channelId,
            q: searchQuery,
            type: 'video',
            maxResults: 3,
            order: 'relevance',
          });

          if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            const videoIds = searchResponse.data.items.map(item => item.id.videoId);
            const videoDetailsResponse = await this.youtube.videos.list({
              part: 'statistics,contentDetails,snippet',
              id: videoIds.join(','),
            });

            for (const video of videoDetailsResponse.data.items) {
              const duration = this.parseDuration(video.contentDetails.duration);
              const viewCount = parseInt(video.statistics.viewCount || 0);
              const likeCount = parseInt(video.statistics.likeCount || 0);

              allVideos.push({
                id: `youtube_${video.id}_${uuidv4()}`,
                title: video.snippet.title,
                description: video.snippet.description.substring(0, 500),
                url: `https://www.youtube.com/watch?v=${video.id}`,
                type: 'video',
                skill: skill,
                difficulty: difficulty,
                duration: Math.floor(duration / 60),
                source: 'youtube',
                provider: video.snippet.channelTitle,
                credibility: 0.95, // Trusted channels get high credibility
                rating: Math.min((likeCount / (viewCount + 1)) * 1000, 5),
                popularity: viewCount,
                metadata: {
                  videoId: video.id,
                  channelId: video.snippet.channelId,
                  channelTitle: video.snippet.channelTitle,
                  publishedAt: video.snippet.publishedAt,
                  thumbnail: video.snippet.thumbnails.high.url,
                  views: viewCount,
                  likes: likeCount,
                  trustedChannel: true,
                },
              });
            }
          }
        } catch (channelError) {
          logger.warn(`⚠️ Failed to fetch from channel ${channelId}:`, channelError.message);
          continue;
        }
      }

      // Sort by popularity and recency
      allVideos.sort((a, b) => b.popularity - a.popularity);

      logger.info(`✅ Found ${allVideos.length} videos from trusted channels for: ${skill}`);
      return allVideos.slice(0, maxResults);
    } catch (error) {
      logger.error(`❌ Trusted channel search failed for: ${skill}`, error);
      return [];
    }
  }

  /**
   * Parse ISO 8601 duration to seconds
   * @param {string} duration - ISO 8601 duration (e.g., "PT15M33S")
   * @returns {number} Duration in seconds
   */
  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] || '').replace('H', '') || 0;
    const minutes = (match[2] || '').replace('M', '') || 0;
    const seconds = (match[3] || '').replace('S', '') || 0;
    
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  }

  /**
   * Calculate credibility score for a video
   * @param {Object} metrics - Video metrics
   * @returns {number} Credibility score (0-1)
   */
  calculateCredibility({ viewCount, likeCount, commentCount, channelId }) {
    let score = 0;

    // View count factor (max 0.4)
    if (viewCount > 1000000) score += 0.4;
    else if (viewCount > 100000) score += 0.3;
    else if (viewCount > 10000) score += 0.2;
    else if (viewCount > 1000) score += 0.1;

    // Engagement factor (likes + comments, max 0.3)
    const engagementRate = (likeCount + commentCount) / (viewCount + 1);
    if (engagementRate > 0.05) score += 0.3;
    else if (engagementRate > 0.03) score += 0.2;
    else if (engagementRate > 0.01) score += 0.1;

    // Trusted channel bonus (max 0.3)
    if (this.trustedChannels.includes(channelId)) {
      score += 0.3;
    } else {
      score += 0.1; // Small bonus for any channel
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get channel details for verification
   * @param {string} channelId - YouTube channel ID
   */
  async getChannelInfo(channelId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await this.youtube.channels.list({
        part: 'snippet,statistics',
        id: channelId,
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          subscribers: parseInt(channel.statistics.subscriberCount || 0),
          videoCount: parseInt(channel.statistics.videoCount || 0),
          viewCount: parseInt(channel.statistics.viewCount || 0),
          thumbnail: channel.snippet.thumbnails.high.url,
        };
      }

      return null;
    } catch (error) {
      logger.error(`❌ Failed to get channel info: ${channelId}`, error);
      return null;
    }
  }

  /**
   * Validate API key and check quota
   */
  async validateApiKey() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Test with a simple search
      const testResponse = await this.youtube.search.list({
        part: 'snippet',
        q: 'test',
        maxResults: 1,
      });

      logger.info('✅ YouTube API key is valid');
      return true;
    } catch (error) {
      if (error.code === 403) {
        logger.error('❌ YouTube API quota exceeded or invalid key');
      } else {
        logger.error('❌ YouTube API validation failed:', error);
      }
      return false;
    }
  }
}

// Export singleton instance
const youtubeDataService = new YouTubeDataService();

module.exports = youtubeDataService;
