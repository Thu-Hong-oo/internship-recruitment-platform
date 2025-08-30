const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const googleAuthService = require('../services/googleAuth');
const { sendEmailVerification, sendPasswordResetEmail } = require('../services/emailService');

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
      error: 'Email này đã được sử dụng bởi tài khoản khác'
    });
  }

  // Validate password for local registration
  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Mật khẩu là bắt buộc khi đăng ký tài khoản'
    });
  }

  // Create user with local authentication
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || 'student',
    authMethod: 'local',
    isEmailVerified: false
  });

  // Generate email verification token and OTP
  const verificationToken = crypto.randomBytes(20).toString('hex');
  const verificationOtp = verificationToken.substring(0, 6).toUpperCase();
  
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  user.emailVerificationOtp = verificationOtp; // Store the original OTP
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await sendEmailVerification(user, verificationToken);
  } catch (error) {
    logger.error('Failed to send verification email', { error: error.message, userId: user._id });
    // Don't fail registration if email fails, just log it
  }

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
      authMethod: user.authMethod,
      isEmailVerified: user.isEmailVerified
    },
    message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
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
      error: 'Vui lòng cung cấp email và mật khẩu'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Email này chưa được đăng ký trong hệ thống',
      errorType: 'EMAIL_NOT_REGISTERED'
    });
  }

  // Check if user can use password authentication
  if (!user.canUsePassword()) {
    return res.status(401).json({
      success: false,
      error: 'Tài khoản này sử dụng Google OAuth. Vui lòng đăng nhập bằng Google.',
      errorType: 'GOOGLE_OAUTH_REQUIRED'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Mật khẩu không chính xác',
      errorType: 'INVALID_PASSWORD'
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(401).json({
      success: false,
      error: 'Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập.',
      errorType: 'EMAIL_NOT_VERIFIED',
      requiresEmailVerification: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
        authMethod: user.authMethod
      }
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Tài khoản đã bị vô hiệu hóa',
      errorType: 'ACCOUNT_DISABLED'
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
    message: 'Đăng xuất thành công'
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
      error: 'Mật khẩu hiện tại không chính xác'
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
      error: 'Không tìm thấy tài khoản với email này'
    });
  }

  // Get reset token and OTP
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetOtp = resetToken.substring(0, 6).toUpperCase();

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordOtp = resetOtp; // Store the OTP for verification

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Send password reset email
  try {
    await sendPasswordResetEmail(user, resetToken);
    
    logger.info(`Password reset email sent to: ${user.email}`, { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Email đặt lại mật khẩu đã được gửi thành công'
    });
  } catch (error) {
    logger.error('Failed to send password reset email', { error: error.message, userId: user._id });
    
    res.status(500).json({
      success: false,
      error: 'Không thể gửi email đặt lại mật khẩu'
    });
  }
});

// @desc    Reset password with OTP
// @route   PUT /api/auth/resetpassword
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email, OTP và mật khẩu mới là bắt buộc'
    });
  }

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này'
    });
  }

  // Check if OTP matches
  if (user.resetPasswordOtp !== otp.toUpperCase()) {
    return res.status(400).json({
      success: false,
      error: 'Mã OTP không chính xác'
    });
  }

  // Check if token is expired
  if (user.resetPasswordExpire < Date.now()) {
    return res.status(400).json({
      success: false,
      error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordOtp = undefined;
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
      error: 'Google ID token là bắt buộc'
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
      error: error.message || 'Xác thực Google thất bại'
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
      error: 'Google ID token là bắt buộc'
    });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản đã được liên kết với Google'
      });
    }

    // Verify Google ID token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ googleId: googleUser.googleId });
    if (existingGoogleUser) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản Google này đã được liên kết với người dùng khác'
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
      message: 'Liên kết tài khoản Google thành công',
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
      error: error.message || 'Không thể liên kết tài khoản Google'
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
        error: 'Không tìm thấy người dùng'
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Không thể hủy liên kết Google nếu đó là phương thức xác thực duy nhất'
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        error: 'Không có tài khoản Google nào được liên kết'
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
      message: 'Hủy liên kết tài khoản Google thành công',
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
      error: error.message || 'Không thể hủy liên kết tài khoản Google'
    });
  }
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Email và mã OTP là bắt buộc'
    });
  }

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Email đã được xác thực trước đó'
    });
  }

  // Check if OTP matches the stored OTP
  const expectedOtp = user.emailVerificationOtp;

  if (!expectedOtp || expectedOtp !== otp.toUpperCase()) {
    // Log for debugging
    logger.error('OTP verification failed', {
      userId: user._id,
      email: user.email,
      providedOtp: otp.toUpperCase(),
      expectedOtp: expectedOtp,
      hashedToken: user.emailVerificationToken ? user.emailVerificationToken.substring(0, 10) + '...' : 'null'
    });
    
    return res.status(400).json({
      success: false,
      error: 'Mã OTP không chính xác'
    });
  }

  // Check if token is expired
  if (user.emailVerificationExpire < Date.now()) {
    return res.status(400).json({
      success: false,
      error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới'
    });
  }

  // Set email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationOtp = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  logger.info(`Email verified with OTP for user: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Xác thực email thành công',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified
    }
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Email đã được xác thực'
    });
  }

  // Generate new verification token and OTP
  const verificationToken = crypto.randomBytes(20).toString('hex');
  const verificationOtp = verificationToken.substring(0, 6).toUpperCase();
  
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  user.emailVerificationOtp = verificationOtp; // Store the new OTP
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await sendEmailVerification(user, verificationToken);
    
    logger.info(`Email verification resent to: ${user.email}`, { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Email xác thực đã được gửi thành công'
    });
  } catch (error) {
    logger.error('Failed to resend verification email', { error: error.message, userId: user._id });
    
    res.status(500).json({
      success: false,
      error: 'Không thể gửi email xác thực'
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
  unlinkGoogleAccount,
  verifyEmail,
  resendEmailVerification
};
