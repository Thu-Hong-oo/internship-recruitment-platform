const { logger } = require('../../utils/logger');

/**
 * Cache Service - Centralized caching service using Redis
 * 
 * Features:
 * - Generic caching for any data type
 * - Automatic TTL management
 * - Cache invalidation
 * - Fallback to database if Redis unavailable
 * - Key prefixing for organization
 */
class CacheService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.isAvailable = false;
    
    // Default TTL values (in seconds)
    this.DEFAULT_TTL = {
      // Job-related
      JOB_LIST: 300,           // 5 minutes
      JOB_DETAIL: 600,         // 10 minutes
      JOB_STATS: 300,          // 5 minutes
      
      // Matching & Recommendations
      MATCHING_SCORE: 86400,   // 24 hours
      JOB_RECOMMENDATIONS: 3600, // 1 hour
      CANDIDATE_RECOMMENDATIONS: 3600, // 1 hour
      
      // User & Profile
      USER_PROFILE: 900,       // 15 minutes
      CANDIDATE_PROFILE: 900,  // 15 minutes
      EMPLOYER_PROFILE: 900,   // 15 minutes
      
      // Static/Reference Data
      SKILLS_LIST: 3600,       // 1 hour
      INDUSTRIES_LIST: 86400,  // 24 hours
      SKILL_CATEGORIES: 3600,  // 1 hour
      
      // AI & Roadmaps
      LEARNING_ROADMAP: 3600,  // 1 hour
      AI_ANALYSIS: 1800,       // 30 minutes
      
      // Search Results
      SEARCH_RESULTS: 300,     // 5 minutes
    };
    
    // Key prefixes for organization
    this.KEY_PREFIXES = {
      JOB: 'job',
      JOB_LIST: 'jobs:list',
      JOB_DETAIL: 'job:detail',
      JOB_STATS: 'job:stats',
      MATCHING_SCORE: 'match:score',
      RECOMMENDATIONS: 'recommendations',
      USER_PROFILE: 'user:profile',
      CANDIDATE_PROFILE: 'candidate:profile',
      EMPLOYER_PROFILE: 'employer:profile',
      SKILLS: 'skills',
      INDUSTRIES: 'industries',
      SKILL_CATEGORIES: 'skill:categories',
      ROADMAP: 'roadmap',
      SEARCH: 'search',
    };
  }

  /**
   * Initialize cache service
   * Check Redis connection availability
   */
  async initialize() {
    try {
      if (!this.redisClient) {
        logger.warn('CacheService: Redis client not provided, caching disabled');
        this.isAvailable = false;
        return false;
      }

      // Test connection
      await this.redisClient.ping();
      this.isAvailable = true;
      logger.info('CacheService: Initialized successfully');
      return true;
    } catch (error) {
      logger.warn('CacheService: Redis not available, caching disabled', {
        error: error.message
      });
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Check if cache is available
   */
  isCacheAvailable() {
    return this.isAvailable && this.redisClient;
  }

  /**
   * Generate cache key with prefix
   * @param {string} prefix - Key prefix
   * @param {...string} parts - Key parts to join
   * @returns {string} Full cache key
   */
  generateKey(prefix, ...parts) {
    const keyParts = [prefix, ...parts.filter(Boolean)];
    return keyParts.join(':');
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} Cached data or null
   */
  async get(key) {
    if (!this.isCacheAvailable()) {
      return null;
    }

    try {
      const cached = await this.redisClient.get(key);
      if (cached) {
        logger.debug('Cache hit', { key });
        return JSON.parse(cached);
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null; // Fail silently, fallback to database
    }
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data, ttl = null) {
    if (!this.isCacheAvailable()) {
      return false;
    }

    try {
      const value = JSON.stringify(data);
      
      if (ttl) {
        await this.redisClient.setEx(key, ttl, value);
      } else {
        await this.redisClient.set(key, value);
      }

      logger.debug('Cache set', { key, ttl: ttl || 'no expiry' });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false; // Fail silently
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    if (!this.isCacheAvailable()) {
      return false;
    }

    try {
      await this.redisClient.del(key);
      logger.debug('Cache deleted', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple cache entries by pattern
   * @param {string} pattern - Redis key pattern (e.g., 'jobs:list:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async deleteByPattern(pattern) {
    if (!this.isCacheAvailable()) {
      return 0;
    }

    try {
      // Use SCAN to find all keys matching pattern
      const keys = [];
      let cursor = 0;

      do {
        const result = await this.redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== 0);

      if (keys.length > 0) {
        await this.redisClient.del(keys);
        logger.info('Cache deleted by pattern', { pattern, count: keys.length });
        return keys.length;
      }

      return 0;
    } catch (error) {
      logger.error('Cache delete by pattern error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Get or set pattern (cache-aside pattern)
   * If cache miss, execute fetchFn and cache the result
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if cache miss
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fetched data
   */
  async getOrSet(key, fetchFn, ttl = null) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch from source
    const data = await fetchFn();
    
    // Cache the result
    if (data !== null && data !== undefined) {
      await this.set(key, data, ttl);
    }

    return data;
  }

  // ============================================
  // JOB-RELATED CACHING METHODS
  // ============================================

  /**
   * Cache job list
   * @param {Object} params - Query parameters
   * @param {Array} jobs - Jobs data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheJobList(params, jobs, ttl = null) {
    const key = this.generateKey(
      this.KEY_PREFIXES.JOB_LIST,
      `page:${params.page || 1}`,
      `limit:${params.limit || 10}`,
      params.status ? `status:${params.status}` : null,
      params.sortBy ? `sort:${params.sortBy}` : null,
      params.location ? `loc:${params.location}` : null,
      params.skills ? `skills:${params.skills}` : null
    );
    
    return this.set(key, jobs, ttl || this.DEFAULT_TTL.JOB_LIST);
  }

  /**
   * Get cached job list
   * @param {Object} params - Query parameters
   * @returns {Promise<Array|null>} Cached jobs or null
   */
  async getCachedJobList(params) {
    const key = this.generateKey(
      this.KEY_PREFIXES.JOB_LIST,
      `page:${params.page || 1}`,
      `limit:${params.limit || 10}`,
      params.status ? `status:${params.status}` : null,
      params.sortBy ? `sort:${params.sortBy}` : null,
      params.location ? `loc:${params.location}` : null,
      params.skills ? `skills:${params.skills}` : null
    );
    
    return this.get(key);
  }

  /**
   * Cache job detail
   * @param {string} jobId - Job ID
   * @param {Object} job - Job data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheJobDetail(jobId, job, ttl = null) {
    const key = this.generateKey(this.KEY_PREFIXES.JOB_DETAIL, jobId);
    return this.set(key, job, ttl || this.DEFAULT_TTL.JOB_DETAIL);
  }

  /**
   * Get cached job detail
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Cached job or null
   */
  async getCachedJobDetail(jobId) {
    const key = this.generateKey(this.KEY_PREFIXES.JOB_DETAIL, jobId);
    return this.get(key);
  }

  /**
   * Invalidate job-related caches
   * Call this when a job is created/updated/deleted
   * @param {string} jobId - Job ID (optional, if provided only invalidate that job)
   */
  async invalidateJobCache(jobId = null) {
    if (jobId) {
      // Invalidate specific job
      await this.delete(this.generateKey(this.KEY_PREFIXES.JOB_DETAIL, jobId));
      await this.delete(this.generateKey(this.KEY_PREFIXES.JOB_STATS, jobId));
    }
    
    // Invalidate all job lists (they might contain this job)
    await this.deleteByPattern(`${this.KEY_PREFIXES.JOB_LIST}:*`);
  }

  // ============================================
  // MATCHING SCORE CACHING
  // ============================================

  /**
   * Cache matching score
   * @param {string} candidateId - Candidate ID
   * @param {string} jobId - Job ID
   * @param {Object} score - Matching score data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheMatchingScore(candidateId, jobId, score, ttl = null) {
    const key = this.generateKey(
      this.KEY_PREFIXES.MATCHING_SCORE,
      `candidate:${candidateId}`,
      `job:${jobId}`
    );
    return this.set(key, score, ttl || this.DEFAULT_TTL.MATCHING_SCORE);
  }

  /**
   * Get cached matching score
   * @param {string} candidateId - Candidate ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Cached score or null
   */
  async getCachedMatchingScore(candidateId, jobId) {
    const key = this.generateKey(
      this.KEY_PREFIXES.MATCHING_SCORE,
      `candidate:${candidateId}`,
      `job:${jobId}`
    );
    return this.get(key);
  }

  /**
   * Invalidate matching scores for a job or candidate
   * @param {string} jobId - Job ID (optional)
   * @param {string} candidateId - Candidate ID (optional)
   */
  async invalidateMatchingScore(jobId = null, candidateId = null) {
    if (jobId && candidateId) {
      // Invalidate specific score
      const key = this.generateKey(
        this.KEY_PREFIXES.MATCHING_SCORE,
        `candidate:${candidateId}`,
        `job:${jobId}`
      );
      await this.delete(key);
    } else if (jobId) {
      // Invalidate all scores for this job
      await this.deleteByPattern(`${this.KEY_PREFIXES.MATCHING_SCORE}:*:job:${jobId}`);
    } else if (candidateId) {
      // Invalidate all scores for this candidate
      await this.deleteByPattern(`${this.KEY_PREFIXES.MATCHING_SCORE}:candidate:${candidateId}:*`);
    } else {
      // Invalidate all matching scores
      await this.deleteByPattern(`${this.KEY_PREFIXES.MATCHING_SCORE}:*`);
    }
  }

  // ============================================
  // USER PROFILE CACHING
  // ============================================

  /**
   * Cache user profile
   * @param {string} userId - User ID
   * @param {string} type - Profile type: 'user', 'candidate', 'employer'
   * @param {Object} profile - Profile data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheProfile(userId, type, profile, ttl = null) {
    const prefix = type === 'candidate' 
      ? this.KEY_PREFIXES.CANDIDATE_PROFILE
      : type === 'employer'
      ? this.KEY_PREFIXES.EMPLOYER_PROFILE
      : this.KEY_PREFIXES.USER_PROFILE;
    
    const key = this.generateKey(prefix, userId);
    const defaultTtl = type === 'candidate' || type === 'employer'
      ? this.DEFAULT_TTL.CANDIDATE_PROFILE
      : this.DEFAULT_TTL.USER_PROFILE;
    
    return this.set(key, profile, ttl || defaultTtl);
  }

  /**
   * Get cached profile
   * @param {string} userId - User ID
   * @param {string} type - Profile type: 'user', 'candidate', 'employer'
   * @returns {Promise<Object|null>} Cached profile or null
   */
  async getCachedProfile(userId, type) {
    const prefix = type === 'candidate' 
      ? this.KEY_PREFIXES.CANDIDATE_PROFILE
      : type === 'employer'
      ? this.KEY_PREFIXES.EMPLOYER_PROFILE
      : this.KEY_PREFIXES.USER_PROFILE;
    
    const key = this.generateKey(prefix, userId);
    return this.get(key);
  }

  /**
   * Invalidate profile cache
   * @param {string} userId - User ID
   * @param {string} type - Profile type (optional, if not provided invalidate all types)
   */
  async invalidateProfile(userId, type = null) {
    if (type) {
      const prefix = type === 'candidate' 
        ? this.KEY_PREFIXES.CANDIDATE_PROFILE
        : type === 'employer'
        ? this.KEY_PREFIXES.EMPLOYER_PROFILE
        : this.KEY_PREFIXES.USER_PROFILE;
      await this.delete(this.generateKey(prefix, userId));
    } else {
      // Invalidate all profile types
      await this.delete(this.generateKey(this.KEY_PREFIXES.USER_PROFILE, userId));
      await this.delete(this.generateKey(this.KEY_PREFIXES.CANDIDATE_PROFILE, userId));
      await this.delete(this.generateKey(this.KEY_PREFIXES.EMPLOYER_PROFILE, userId));
    }
  }

  // ============================================
  // STATIC DATA CACHING (Skills, Industries, etc.)
  // ============================================

  /**
   * Cache skills list
   * @param {Array} skills - Skills data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheSkillsList(skills, ttl = null) {
    const key = this.generateKey(this.KEY_PREFIXES.SKILLS, 'list:all');
    return this.set(key, skills, ttl || this.DEFAULT_TTL.SKILLS_LIST);
  }

  /**
   * Get cached skills list
   * @returns {Promise<Array|null>} Cached skills or null
   */
  async getCachedSkillsList() {
    const key = this.generateKey(this.KEY_PREFIXES.SKILLS, 'list:all');
    return this.get(key);
  }

  /**
   * Cache industries list
   * @param {Array} industries - Industries data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheIndustriesList(industries, ttl = null) {
    const key = this.generateKey(this.KEY_PREFIXES.INDUSTRIES, 'list:all');
    return this.set(key, industries, ttl || this.DEFAULT_TTL.INDUSTRIES_LIST);
  }

  /**
   * Get cached industries list
   * @returns {Promise<Array|null>} Cached industries or null
   */
  async getCachedIndustriesList() {
    const key = this.generateKey(this.KEY_PREFIXES.INDUSTRIES, 'list:all');
    return this.get(key);
  }

  /**
   * Invalidate static data caches
   * Call this when skills/industries are updated
   * @param {string} type - 'skills', 'industries', 'all'
   */
  async invalidateStaticData(type = 'all') {
    if (type === 'skills' || type === 'all') {
      await this.deleteByPattern(`${this.KEY_PREFIXES.SKILLS}:*`);
    }
    if (type === 'industries' || type === 'all') {
      await this.deleteByPattern(`${this.KEY_PREFIXES.INDUSTRIES}:*`);
    }
    if (type === 'skillCategories' || type === 'all') {
      await this.deleteByPattern(`${this.KEY_PREFIXES.SKILL_CATEGORIES}:*`);
    }
  }

  // ============================================
  // RECOMMENDATIONS CACHING
  // ============================================

  /**
   * Cache job recommendations for candidate
   * @param {string} candidateId - Candidate ID
   * @param {Array} recommendations - Recommendations data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheJobRecommendations(candidateId, recommendations, ttl = null) {
    const key = this.generateKey(
      this.KEY_PREFIXES.RECOMMENDATIONS,
      'job',
      `candidate:${candidateId}`
    );
    return this.set(key, recommendations, ttl || this.DEFAULT_TTL.JOB_RECOMMENDATIONS);
  }

  /**
   * Get cached job recommendations
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array|null>} Cached recommendations or null
   */
  async getCachedJobRecommendations(candidateId) {
    const key = this.generateKey(
      this.KEY_PREFIXES.RECOMMENDATIONS,
      'job',
      `candidate:${candidateId}`
    );
    return this.get(key);
  }

  /**
   * Cache candidate recommendations for job
   * @param {string} jobId - Job ID
   * @param {Array} recommendations - Recommendations data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheCandidateRecommendations(jobId, recommendations, ttl = null) {
    const key = this.generateKey(
      this.KEY_PREFIXES.RECOMMENDATIONS,
      'candidate',
      `job:${jobId}`
    );
    return this.set(key, recommendations, ttl || this.DEFAULT_TTL.CANDIDATE_RECOMMENDATIONS);
  }

  /**
   * Get cached candidate recommendations
   * @param {string} jobId - Job ID
   * @returns {Promise<Array|null>} Cached recommendations or null
   */
  async getCachedCandidateRecommendations(jobId) {
    const key = this.generateKey(
      this.KEY_PREFIXES.RECOMMENDATIONS,
      'candidate',
      `job:${jobId}`
    );
    return this.get(key);
  }

  // ============================================
  // LEARNING ROADMAP CACHING
  // ============================================

  /**
   * Cache learning roadmap
   * @param {string} roadmapId - Roadmap ID
   * @param {Object} roadmap - Roadmap data
   * @param {number} ttl - TTL override (optional)
   */
  async cacheRoadmap(roadmapId, roadmap, ttl = null) {
    const key = this.generateKey(this.KEY_PREFIXES.ROADMAP, roadmapId);
    return this.set(key, roadmap, ttl || this.DEFAULT_TTL.LEARNING_ROADMAP);
  }

  /**
   * Get cached roadmap
   * @param {string} roadmapId - Roadmap ID
   * @returns {Promise<Object|null>} Cached roadmap or null
   */
  async getCachedRoadmap(roadmapId) {
    const key = this.generateKey(this.KEY_PREFIXES.ROADMAP, roadmapId);
    return this.get(key);
  }

  /**
   * Invalidate roadmap cache
   * @param {string} roadmapId - Roadmap ID (optional, if not provided invalidate all)
   */
  async invalidateRoadmap(roadmapId = null) {
    if (roadmapId) {
      await this.delete(this.generateKey(this.KEY_PREFIXES.ROADMAP, roadmapId));
    } else {
      await this.deleteByPattern(`${this.KEY_PREFIXES.ROADMAP}:*`);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    if (!this.isCacheAvailable()) {
      return {
        available: false,
        message: 'Redis not available'
      };
    }

    try {
      const info = await this.redisClient.info('stats');
      const keyspace = await this.redisClient.info('keyspace');
      
      return {
        available: true,
        info: info,
        keyspace: keyspace
      };
    } catch (error) {
      logger.error('Cache stats error', { error: error.message });
      return {
        available: true,
        error: error.message
      };
    }
  }

  /**
   * Clear all cache (use with caution!)
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    if (!this.isCacheAvailable()) {
      return false;
    }

    try {
      await this.redisClient.flushDb();
      logger.warn('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Clear all cache error', { error: error.message });
      return false;
    }
  }
}

// Export singleton instance
let cacheServiceInstance = null;

/**
 * Initialize cache service
 * @param {Object} redisClient - Redis client instance
 * @returns {Promise<CacheService>} Cache service instance
 */
async function initializeCacheService(redisClient) {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService(redisClient);
    await cacheServiceInstance.initialize();
  }
  return cacheServiceInstance;
}

/**
 * Get cache service instance
 * @returns {CacheService|null} Cache service instance or null
 */
function getCacheService() {
  return cacheServiceInstance;
}

module.exports = {
  CacheService,
  initializeCacheService,
  getCacheService,
};

