/**
 * Resource Health Check Service
 * 
 * Đảm bảo URLs chính xác và hoạt động:
 * 1. Validate URL format
 * 2. Check URL health (HEAD request)
 * 3. Normalize URLs (http → https, trailing slash, etc.)
 * 4. Cache health check results (7-day interval)
 * 5. Filter dead links và outdated content
 * 
 * Căn cứ: RAG_RESOURCE_RECOMMENDATION_DOCUMENTATION.md
 * - Health Check System để filter dead links
 * - Freshness Validation để filter outdated content
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { logger } = require('../../utils/logger');

class ResourceHealthCheckService {
  constructor() {
    // Cache health check results (7-day interval)
    this.healthCheckCache = new Map();
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    // Request timeout
    this.requestTimeout = 5000; // 5 seconds
    
    // Allowed status codes
    this.validStatusCodes = [200, 301, 302, 303, 307, 308];
    
    // Domains with bot protection (403 is acceptable - means URL exists but blocked bots)
    this.botProtectedDomains = [
      'udemy.com',
      'coursera.org',
      'edx.org',
      'pluralsight.com',
      'linkedin.com',
    ];
    
    // User agent để tránh blocking
    this.userAgent = 'Mozilla/5.0 (compatible; ResourceHealthCheck/1.0)';
  }

  /**
   * Validate URL format
   * @param {string} urlString - URL to validate
   * @returns {Object} { valid: boolean, normalized: string, error: string }
   */
  validateUrlFormat(urlString) {
    if (!urlString || typeof urlString !== 'string') {
      return {
        valid: false,
        normalized: null,
        error: 'URL is required and must be a string',
      };
    }

    try {
      // Normalize URL
      let normalized = urlString.trim();
      
      // Add protocol if missing
      if (!normalized.match(/^https?:\/\//i)) {
        normalized = `https://${normalized}`;
      }
      
      // Parse URL để validate format
      const urlObj = new URL(normalized);
      
      // Validate protocol (chỉ cho phép http/https)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          valid: false,
          normalized: null,
          error: `Invalid protocol: ${urlObj.protocol}. Only http/https allowed.`,
        };
      }
      
      // Validate hostname
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return {
          valid: false,
          normalized: null,
          error: 'Invalid hostname',
        };
      }
      
      // Remove trailing slash (trừ root path)
      if (normalized.endsWith('/') && urlObj.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      
      // Force HTTPS for common domains (security)
      if (urlObj.hostname.includes('udemy.com') || 
          urlObj.hostname.includes('coursera.org') ||
          urlObj.hostname.includes('youtube.com') ||
          urlObj.hostname.includes('github.com')) {
        normalized = normalized.replace(/^http:/, 'https:');
      }
      
      return {
        valid: true,
        normalized: normalized,
        error: null,
      };
    } catch (error) {
      return {
        valid: false,
        normalized: null,
        error: `Invalid URL format: ${error.message}`,
      };
    }
  }

  /**
   * Check URL health với HEAD request
   * @param {string} urlString - URL to check
   * @param {boolean} useCache - Use cached result if available
   * @returns {Promise<Object>} { valid: boolean, statusCode: number, error: string, checkedAt: Date }
   */
  async checkResourceHealth(urlString, useCache = true) {
    // Validate format first
    const formatCheck = this.validateUrlFormat(urlString);
    if (!formatCheck.valid) {
      return {
        valid: false,
        statusCode: null,
        error: formatCheck.error,
        checkedAt: new Date(),
        normalized: null,
      };
    }

    const normalizedUrl = formatCheck.normalized;
    
    // Check cache
    if (useCache && this.healthCheckCache.has(normalizedUrl)) {
      const cached = this.healthCheckCache.get(normalizedUrl);
      const now = Date.now();
      
      if (now - cached.checkedAt < this.cacheExpiry) {
        logger.debug('Using cached health check result', {
          url: normalizedUrl,
          statusCode: cached.statusCode,
          age: Math.round((now - cached.checkedAt) / (1000 * 60 * 60)) + ' hours',
        });
        return cached;
      }
    }

    // Perform health check
    try {
      const result = await this._performHealthCheck(normalizedUrl);
      
      // Cache result
      this.healthCheckCache.set(normalizedUrl, {
        ...result,
        checkedAt: Date.now(),
      });
      
      return result;
    } catch (error) {
      logger.error('Health check failed', {
        url: normalizedUrl,
        error: error.message,
      });
      
      return {
        valid: false,
        statusCode: null,
        error: error.message,
        checkedAt: new Date(),
        normalized: normalizedUrl,
      };
    }
  }

  /**
   * Perform actual HTTP HEAD request
   * @private
   */
  _performHealthCheck(urlString) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(urlString);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': '*/*',
        },
        // Allow redirects (max 3)
        maxRedirects: 3,
      };

      const req = client.request(options, (res) => {
        const statusCode = res.statusCode;
        
        // Check if domain has bot protection
        const isBotProtected = this.botProtectedDomains.some(domain => 
          urlObj.hostname.includes(domain)
        );
        
        // For bot-protected domains, 403 means URL exists but blocked bots (still valid)
        // For other domains, 403 means forbidden (invalid)
        let isValid;
        if (isBotProtected && statusCode === 403) {
          isValid = true; // URL exists, just bot protection
        } else {
          isValid = this.validStatusCodes.includes(statusCode);
        }
        
        // Consume response để close connection
        res.on('data', () => {});
        res.on('end', () => {
          resolve({
            valid: isValid,
            statusCode: statusCode,
            error: isValid ? null : `Invalid status code: ${statusCode}`,
            checkedAt: new Date(),
            normalized: urlString,
            isBotProtected: isBotProtected && statusCode === 403,
          });
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Check freshness (lastUpdated timestamp)
   * @param {Object} resource - Resource object
   * @param {number} maxAgeDays - Maximum age in days (default: 365)
   * @returns {Object} { isFresh: boolean, age: number, error: string }
   */
  validateFreshness(resource, maxAgeDays = 365) {
    if (!resource.lastUpdated && !resource.indexedAt) {
      // Không có timestamp → assume fresh (có thể là official docs)
      return {
        isFresh: true,
        age: null,
        error: null,
      };
    }

    const lastUpdated = resource.lastUpdated 
      ? new Date(resource.lastUpdated)
      : new Date(resource.indexedAt);
    
    const now = new Date();
    const ageDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
    
    const isFresh = ageDays <= maxAgeDays;
    
    return {
      isFresh,
      age: ageDays,
      error: isFresh ? null : `Resource is too old: ${ageDays} days (max: ${maxAgeDays} days)`,
    };
  }

  /**
   * Check if URL is a search URL (YouTube, Udemy, Coursera search)
   * These URLs are valid but don't need health check
   * @param {string} url - URL to check
   * @returns {boolean} True if it's a search URL
   */
  isSearchUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const searchUrlPatterns = [
      /youtube\.com\/results\?search_query=/i,
      /udemy\.com\/courses\/search/i,
      /coursera\.org\/search/i,
      /github\.com\/search/i,
      /developer\.mozilla\.org\/.*\/search/i,
    ];
    
    return searchUrlPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Filter valid resources (health check + freshness)
   * @param {Array} resources - Array of resource objects
   * @returns {Promise<Array>} Filtered resources
   */
  async filterValidResources(resources) {
    if (!Array.isArray(resources) || resources.length === 0) {
      return [];
    }

    const validResources = [];
    const healthChecks = [];

    // Batch health checks (parallel với limit)
    const batchSize = 5; // Check 5 URLs at a time
    for (let i = 0; i < resources.length; i += batchSize) {
      const batch = resources.slice(i, i + batchSize);
      
      const batchChecks = await Promise.allSettled(
        batch.map(async (resource) => {
          if (!resource.url) {
            return { resource, health: { valid: false, error: 'Missing URL' } };
          }

          // Skip health check for search URLs (they're always valid)
          if (this.isSearchUrl(resource.url)) {
            const urlValidation = this.validateUrlFormat(resource.url);
            return {
              resource,
              health: {
                valid: urlValidation.valid,
                normalized: urlValidation.normalized || resource.url,
                statusCode: 200, // Search URLs are always accessible
                error: null,
                checkedAt: new Date(),
                isSearchUrl: true,
              },
              freshness: this.validateFreshness(resource),
            };
          }

          // Check health for direct URLs
          const health = await this.checkResourceHealth(resource.url, true);
          
          // Check freshness
          const freshness = this.validateFreshness(resource);
          
          return {
            resource,
            health,
            freshness,
          };
        })
      );

      healthChecks.push(...batchChecks);
    }

    // Filter valid resources
    for (const check of healthChecks) {
      if (check.status === 'fulfilled') {
        const { resource, health, freshness } = check.value;
        
        if (health.valid && freshness.isFresh) {
          // Update resource với normalized URL
          validResources.push({
            ...resource,
            url: health.normalized || resource.url,
            healthStatus: 'valid',
            lastHealthCheck: health.checkedAt,
          });
        } else {
          logger.debug('Resource filtered out', {
            title: resource.title,
            url: resource.url,
            healthValid: health.valid,
            healthError: health.error,
            isFresh: freshness.isFresh,
            freshnessError: freshness.error,
          });
        }
      } else {
        logger.warn('Health check failed', {
          error: check.reason?.message,
        });
      }
    }

    logger.info('Filtered valid resources', {
      original: resources.length,
      valid: validResources.length,
      filtered: resources.length - validResources.length,
    });

    return validResources;
  }

  /**
   * Normalize URL (public method)
   * @param {string} urlString - URL to normalize
   * @returns {string} Normalized URL or null if invalid
   */
  normalizeUrl(urlString) {
    const formatCheck = this.validateUrlFormat(urlString);
    return formatCheck.normalized;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    let cleared = 0;

    for (const [url, cached] of this.healthCheckCache.entries()) {
      if (now - cached.checkedAt >= this.cacheExpiry) {
        this.healthCheckCache.delete(url);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Cleared expired cache entries', { count: cleared });
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.healthCheckCache.size,
      expiryDays: this.cacheExpiry / (1000 * 60 * 60 * 24),
    };
  }
}

module.exports = new ResourceHealthCheckService();

