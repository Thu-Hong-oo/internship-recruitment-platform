const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

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
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }

    // Nếu tài khoản bị vô hiệu hóa, chỉ cho phép truy cập /api/users/reactivate
    if (!req.user.isActive && req.originalUrl !== '/api/users/reactivate') {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản đã bị tạm ngưng, không thể thực hiện thao tác này.',
      });
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
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
  authorize,
};
