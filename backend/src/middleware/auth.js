const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const asyncHandler = require('express-async-handler');
const { AppError } = require('../utils/errors');

/**
 * Protect routes - Verify token and attach user to req object
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new AppError('Not authorized to access this route', 401);
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    // Nếu tài khoản bị vô hiệu hóa, chỉ cho phép truy cập /api/users/reactivate
    if (!req.user.isActive && req.originalUrl !== '/api/users/reactivate') {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản đã bị tạm ngưng, không thể thực hiện thao tác này.',
      });
    }

    // Ensure candidate profile reference for candidate role
    if (req.user.role === 'candidate') {
      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (profile) {
        req.user.candidateProfile = profile._id;
      }
    }

    next();
  } catch (error) {
    // If error is already AppError, throw it
    if (error.statusCode) {
      throw error;
    }
    // Otherwise, wrap in AppError with 401 status
    throw new AppError('Not authorized to access this route', 401);
  }
});

/**
 * Optional protect - Verify token if present, but don't require it
 * Useful for public routes that need user info if available
 */
const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, just continue (route is public)
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (req.user) {
      // Ensure candidate profile reference for candidate role
      if (req.user.role === 'candidate') {
        const profile = await CandidateProfile.findOne({ userId: req.user.id });
        if (profile) {
          req.user.candidateProfile = profile._id;
        }
      }
    }
  } catch (error) {
    // If token is invalid, just continue without req.user (route is public)
    // Don't throw error, just log it
    console.log('Optional protect: Invalid token, continuing as public request');
  }

  next();
});

/**
 * Grant access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role ${req.user.role} is not authorized to access this route`,
        allowedRoles: roles,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  optionalProtect,
  authorize,
};
