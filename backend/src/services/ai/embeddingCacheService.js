/**
 * 🗄️ Embedding Cache Service
 * 
 * Cache embeddings để optimize performance
 * Sử dụng in-memory cache với TTL
 * 
 * Future: Có thể migrate sang Redis nếu cần scale
 */

const { logger } = require('../../utils/logger');

class EmbeddingCacheService {
  constructor() {
    // In-memory cache: Map<key, {embedding, expiresAt}>
    this.cache = new Map();
    
    // Cleanup interval (mỗi 1 giờ)
    this.cleanupInterval = setInterval(() => {
      this._cleanup();
    }, 3600 * 1000);
  }

  /**
   * Get embedding from cache
   * 
   * @param {string} key - Cache key
   * @returns {Promise<number[]|null>} Cached embedding or null
   */
  async get(key) {
    try {
      const cached = this.cache.get(key);
      
      if (!cached) {
        return null;
      }

      // Check expiration
      if (Date.now() > cached.expiresAt) {
        this.cache.delete(key);
        return null;
      }

      return cached.embedding;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set embedding in cache
   * 
   * @param {string} key - Cache key
   * @param {number[]} embedding - Embedding vector
   * @param {number} ttl - Time to live in seconds (default: 24 hours)
   */
  async set(key, embedding, ttl = 3600 * 24) {
    try {
      const expiresAt = Date.now() + (ttl * 1000);
      
      this.cache.set(key, {
        embedding,
        expiresAt,
        cachedAt: Date.now()
      });

      // Limit cache size (prevent memory leak)
      if (this.cache.size > 10000) {
        this._evictOldest();
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Delete from cache
   */
  async delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear() {
    this.cache.clear();
    logger.info('Embedding cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      memoryUsage: this._estimateMemoryUsage()
    };
  }

  /**
   * Cleanup expired entries
   */
  _cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  _evictOldest() {
    // Sort by cachedAt, remove oldest 20%
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt);

    const toRemove = Math.floor(entries.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    logger.info(`Evicted ${toRemove} oldest cache entries`);
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  _estimateMemoryUsage() {
    let totalSize = 0;
    
    for (const value of this.cache.values()) {
      // Rough estimate: 768 floats * 8 bytes + overhead
      totalSize += (value.embedding.length * 8) + 100; // 100 bytes overhead
    }

    return {
      bytes: totalSize,
      mb: (totalSize / (1024 * 1024)).toFixed(2),
      entries: this.cache.size
    };
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
let instance = null;

function getEmbeddingCacheService() {
  if (!instance) {
    instance = new EmbeddingCacheService();
  }
  return instance;
}

module.exports = {
  EmbeddingCacheService,
  getEmbeddingCacheService
};

