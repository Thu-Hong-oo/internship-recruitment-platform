const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Rate limiter cho email verification OTP
const emailVerificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3, // Tối đa 3 lần gửi OTP trong 15 phút
  message: {
    success: false,
    error: 'Bạn đã gửi quá nhiều yêu cầu xác thực email. Vui lòng thử lại sau 15 phút.',
    retryAfter: 15 * 60 // 15 phút
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng email làm key để rate limit theo từng email
    return req.body.email || req.user?.email || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Email verification rate limit exceeded', {
      email: req.body.email || req.user?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Bạn đã gửi quá nhiều yêu cầu xác thực email. Vui lòng thử lại sau 15 phút.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter cho password reset OTP
const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3, // Tối đa 3 lần gửi OTP trong 15 phút
  message: {
    success: false,
    error: 'Bạn đã gửi quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút.',
    retryAfter: 15 * 60 // 15 phút
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng email làm key để rate limit theo từng email
    return req.body.email || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      email: req.body.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Bạn đã gửi quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter cho OTP verification (ngăn brute force)
const otpVerificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 lần nhập sai OTP trong 15 phút
  message: {
    success: false,
    error: 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.',
    retryAfter: 15 * 60 // 15 phút
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng email làm key để rate limit theo từng email
    return req.body.email || req.ip;
  },
  handler: (req, res) => {
    logger.warn('OTP verification rate limit exceeded', {
      email: req.body.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter cho resend verification (gửi lại OTP)
const resendVerificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 2, // Tối đa 2 lần gửi lại OTP trong 5 phút
  message: {
    success: false,
    error: 'Bạn đã yêu cầu gửi lại OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.',
    retryAfter: 5 * 60 // 5 phút
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng user ID hoặc email làm key
    return req.user?.id || req.user?.email || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Resend verification rate limit exceeded', {
      userId: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Bạn đã yêu cầu gửi lại OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.',
      retryAfter: 5 * 60
    });
  }
});

module.exports = {
  emailVerificationRateLimit,
  passwordResetRateLimit,
  otpVerificationRateLimit,
  resendVerificationRateLimit
};
