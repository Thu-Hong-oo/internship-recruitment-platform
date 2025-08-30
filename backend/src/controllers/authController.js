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
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
  verifyEmail,
  resendEmailVerification
};
