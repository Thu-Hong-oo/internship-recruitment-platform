const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const googleAuthService = require('../services/googleAuth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with this email'
    });
  }

  // Validate password for local registration
  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required for local registration'
    });
  }

  // Create user with local authentication
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || 'student',
    authMethod: 'local'
  });

  // Create token
  const token = user.getSignedJwtToken();

  logger.info(`New user registered with local auth: ${user.email}`, { userId: user._id, role: user.role });

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: user.fullName,
      authMethod: user.authMethod
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if user can use password authentication
  if (!user.canUsePassword()) {
    return res.status(401).json({
      success: false,
      error: 'This account uses Google OAuth. Please use Google to sign in.'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Account is deactivated'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Create token
  const token = user.getSignedJwtToken();

  logger.info(`User logged in with local auth: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: user.fullName,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      authMethod: user.authMethod
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`, { userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    dateOfBirth: req.body.dateOfBirth,
    gender: req.body.gender,
    address: req.body.address,
    education: req.body.education
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  logger.info(`User details updated: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      error: 'Password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  logger.info(`Password updated for user: ${user.email}`, { userId: user._id });

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'There is no user with that email'
    });
  }

  // Get reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  logger.info(`Password reset requested for: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Email sent',
    resetUrl
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`Password reset completed for: ${user.email}`, { userId: user._id });

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token
  });
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: 'Google ID token is required'
    });
  }

  try {
    const result = await googleAuthService.processGoogleAuth(idToken);
    
    logger.info(`Google OAuth successful: ${result.user.email}`, { 
      userId: result.user.id,
      isNew: result.isNew 
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('Google OAuth failed', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Google authentication failed'
    });
  }
});

// @desc    Link Google account to existing account
// @route   POST /api/auth/link-google
// @access  Private
const linkGoogleAccount = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const userId = req.user.id;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: 'Google ID token is required'
    });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Account is already linked to Google'
      });
    }

    // Verify Google ID token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ googleId: googleUser.googleId });
    if (existingGoogleUser) {
      return res.status(400).json({
        success: false,
        error: 'This Google account is already linked to another user'
      });
    }

    // Link Google account
    user.googleId = googleUser.googleId;
    user.googleEmail = googleUser.email;
    user.googleProfile = {
      picture: googleUser.picture,
      locale: googleUser.locale,
      verified_email: googleUser.verified_email
    };
    user.authMethod = 'hybrid'; // User can now use both methods
    user.isEmailVerified = true;

    await user.save();

    logger.info(`Google account linked to user: ${user.email}`, { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Google account linked successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar || user.googleProfile?.picture,
        isEmailVerified: user.isEmailVerified,
        authMethod: user.authMethod
      }
    });
  } catch (error) {
    logger.error('Failed to link Google account', { error: error.message, userId });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to link Google account'
    });
  }
});

// @desc    Unlink Google account
// @route   DELETE /api/auth/unlink-google
// @access  Private
const unlinkGoogleAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Cannot unlink Google account if it\'s the only authentication method'
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        error: 'No Google account linked'
      });
    }

    // Unlink Google account
    user.googleId = undefined;
    user.googleEmail = undefined;
    user.googleProfile = undefined;
    user.authMethod = 'local';

    await user.save();

    logger.info(`Google account unlinked from user: ${user.email}`, { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Google account unlinked successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        authMethod: user.authMethod
      }
    });
  } catch (error) {
    logger.error('Failed to unlink Google account', { error: error.message, userId });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to unlink Google account'
    });
  }
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
  linkGoogleAccount,
  unlinkGoogleAccount
};
