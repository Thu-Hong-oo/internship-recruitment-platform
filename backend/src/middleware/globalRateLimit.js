const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  global: {
    windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 phút
    max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX) || 100,
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.',
    retryAfter: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW) || 15 * 60,
  },
  api: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 phút
    max: parseInt(process.env.API_RATE_LIMIT_MAX) || 200,
    message: 'Quá nhiều yêu cầu API. Vui lòng thử lại sau 15 phút.',
    retryAfter: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60,
  },
  search: {
    windowMs: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW) || 5 * 60 * 1000, // 5 phút
    max: parseInt(process.env.SEARCH_RATE_LIMIT_MAX) || 30,
    message: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau 5 phút.',
    retryAfter: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW) || 5 * 60,
  },
  upload: {
    windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW) || 10 * 60 * 1000, // 10 phút
    max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 10,
    message: 'Quá nhiều yêu cầu upload. Vui lòng thử lại sau 10 phút.',
    retryAfter: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW) || 10 * 60,
  },
};

// Factory function tạo ra objects với config khác nhau
const createRateLimiter = (type, config) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      error: config.message,
      retryAfter: config.retryAfter,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => {
      // Sử dụng user ID nếu đã đăng nhập, hoặc IP nếu chưa
      return req.user ? req.user.id : req.ip;
    },
    handler: (req, res) => {
      logger.warn(`${type} rate limit exceeded`, {
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        type,
      });
      res.status(429).json({
        success: false,
        error: config.message,
        retryAfter: config.retryAfter,
      });
    },
  });
};

// Global rate limiter cho tất cả requests
const globalRateLimit = createRateLimiter('Global', RATE_LIMIT_CONFIG.global);

// Rate limiter cho API endpoints (khác với auth)
const apiRateLimit = createRateLimiter('API', RATE_LIMIT_CONFIG.api);

// Rate limiter cho search/query endpoints (thường bị spam nhiều)
const searchRateLimit = createRateLimiter('Search', RATE_LIMIT_CONFIG.search);

// Rate limiter cho file upload
const uploadRateLimit = createRateLimiter('Upload', RATE_LIMIT_CONFIG.upload);

module.exports = {
  globalRateLimit,
  apiRateLimit,
  searchRateLimit,
  uploadRateLimit,
  RATE_LIMIT_CONFIG,
};
