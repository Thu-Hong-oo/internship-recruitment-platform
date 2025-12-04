/**
 * Cache Control Middleware
 * 
 * Provides fine-grained cache control for API endpoints
 * Supports:
 * - X-Force-Refresh header to bypass cache
 * - X-Cache-TTL header to override default TTL
 * - Cache-Control header for HTTP caching
 * 
 * @author Thu-Hong-oo
 * @date 2025-12-04
 */

const { logger } = require('../utils/logger');
const { getCacheService } = require('../services/cache/cacheService');

/**
 * Cache control middleware factory
 * @param {Object} options - Cache control options
 * @param {boolean} options.noCache - Disable caching completely (default: false)
 * @param {number} options.maxAge - Cache max age in seconds (default: 300)
 * @param {boolean} options.allowForceRefresh - Allow X-Force-Refresh header (default: true)
 * @param {string} options.cacheKey - Custom cache key (optional)
 * @returns {Function} Express middleware
 */
function cacheControl(options = {}) {
  const {
    noCache = false,
    maxAge = 300,
    allowForceRefresh = true,
    cacheKey = null
  } = options;

  return (req, res, next) => {
    // Attach cache control flags to request
    req.cacheControl = {
      enabled: !noCache,
      maxAge,
      forceRefresh: false,
      customKey: cacheKey
    };

    // Check for X-Force-Refresh header
    if (allowForceRefresh && req.headers['x-force-refresh'] === 'true') {
      req.cacheControl.forceRefresh = true;
      logger.info(`🔄 Force refresh requested for ${req.method} ${req.path}`);
    }

    // Check for X-Cache-TTL header
    const customTTL = parseInt(req.headers['x-cache-ttl']);
    if (!isNaN(customTTL) && customTTL >= 0) {
      req.cacheControl.maxAge = customTTL;
      logger.info(`⏱️ Custom TTL ${customTTL}s for ${req.method} ${req.path}`);
    }

    // Set HTTP Cache-Control header
    if (noCache) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', `max-age=${maxAge}, private`);
    }

    next();
  };
}

/**
 * Disable all caching for an endpoint
 * Usage: app.use('/api/nlp/matching-score', noCache());
 */
function noCache() {
  return cacheControl({ noCache: true });
}

/**
 * Short-lived cache (1 minute)
 * For frequently changing data
 */
function shortCache() {
  return cacheControl({ maxAge: 60 });
}

/**
 * Medium cache (5 minutes)
 * For moderately stable data
 */
function mediumCache() {
  return cacheControl({ maxAge: 300 });
}

/**
 * Long cache (1 hour)
 * For stable data like skills, industries
 */
function longCache() {
  return cacheControl({ maxAge: 3600 });
}

/**
 * Helper to check if cache should be bypassed
 * @param {Object} req - Express request
 * @returns {boolean}
 */
function shouldBypassCache(req) {
  return (
    req.cacheControl?.forceRefresh === true ||
    req.cacheControl?.enabled === false ||
    req.body?.forceRecalculate === true ||
    req.query?.forceRefresh === 'true'
  );
}

module.exports = {
  cacheControl,
  noCache,
  shortCache,
  mediumCache,
  longCache,
  shouldBypassCache
};
