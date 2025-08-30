const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Check if user's email is verified
// @access  Private
const requireEmailVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Skip email verification for Google OAuth users
  if (user.authMethod === 'google') {
    return next();
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required. Please check your email and verify your account.',
      requiresVerification: true
    });
  }

  next();
});

// @desc    Check if user's email is verified (optional - returns warning but doesn't block)
// @access  Private
const checkEmailVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Skip email verification for Google OAuth users
  if (user.authMethod === 'google') {
    return next();
  }

  if (!user.isEmailVerified) {
    // Add warning to response but don't block the request
    req.emailVerificationWarning = true;
  }

  next();
});

module.exports = {
  requireEmailVerification,
  checkEmailVerification
};
