const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Global rate limiter cho tất cả requests
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests trong 15 phút
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng IP address làm key
    return req.ip;
  },
  handler: (req, res) => {
    logger.warn('Global rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter cho API endpoints (khác với auth)
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Tối đa 200 requests trong 15 phút
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu API. Vui lòng thử lại sau 15 phút.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng user ID nếu đã đăng nhập, hoặc IP nếu chưa
    return req.user ? req.user.id : req.ip;
  },
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu API. Vui lòng thử lại sau 15 phút.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter cho search/query endpoints (thường bị spam nhiều)
const searchRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 30, // Tối đa 30 search requests trong 5 phút
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau 5 phút.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau 5 phút.',
      retryAfter: 5 * 60
    });
  }
});

// Rate limiter cho file upload
const uploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 10, // Tối đa 10 uploads trong 10 phút
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu upload. Vui lòng thử lại sau 10 phút.',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu upload. Vui lòng thử lại sau 10 phút.',
      retryAfter: 10 * 60
    });
  }
});

module.exports = {
  globalRateLimit,
  apiRateLimit,
  searchRateLimit,
  uploadRateLimit
};
