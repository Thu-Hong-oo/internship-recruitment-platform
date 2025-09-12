const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const googleAuthService = require('../services/googleAuth');
const EmailService = require('../services/emailService');
const {
  OTP,
  VALIDATION,
  ERRORS,
  SUCCESS,
  ERROR_CODES,
} = require('../constants/auth.constants');
const {
  getOTPService,
  getOTPCooldownService,
} = require('../config/initializeServices');

const { getAvatarUrl } = require('../utils/avatarUtils');

const resolveFullName = user => {
  if (user?.fullName && user.fullName.trim().length > 0) return user.fullName;
  if (user?.displayFullName && String(user.displayFullName).trim().length > 0)
    return String(user.displayFullName).trim();
  if (user?.email) return user.email.split('@')[0];
  return 'User';
};

const baseUserResponse = user => ({
  id: user._id,
  email: user.email,
  fullName: resolveFullName(user),
  role: user.role,
  authMethod: user.authMethod,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  avatar: getAvatarUrl(user),
  googleProfile: user.googleProfile,
  preferences: user.preferences,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  candidateProfile: user.candidateProfile,
  employerProfile: user.employerProfile,
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, role } = req.body;
  const otpService = getOTPService();

  if (!otpService) {
    return res.status(500).json({
      success: false,
      error: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
    });
  }

  try {
    // Check if user already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: ERRORS.EMAIL_EXISTS,
      });
    }

    // Check if email is already in registration process (Redis)
    const existingRegistration = await otpService.get(
      `user_registration:${email}`
    );
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        error:
          'Email này đang trong quá trình đăng ký. Vui lòng kiểm tra email để xác thực hoặc đợi 24 giờ để đăng ký lại.',
      });
    }

    // Generate verification token and OTP
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationOtp = verificationToken.substring(0, 6).toUpperCase();

    // Store user data in Redis
    const userData = {
      email,
      password,
      fullName,
      role,
      verificationToken: crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex'),
    };

    await otpService.setWithExpiry(
      `user_registration:${email}`,
      JSON.stringify(userData),
      24 * 60 * 60 // 24 hours expiry
    );

    // Store OTP
    await otpService.storeOTP('email_verification', email, verificationOtp);

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(
        { email, fullName },
        verificationOtp
      );

      res.status(201).json({
        success: true,
        message: SUCCESS.REGISTER,
        email,
        emailSent: true,
      });
    } catch (emailError) {
      logger.error('Failed to send verification email during registration', {
        error: emailError.message,
        email,
      });

      // Cleanup stored data if email sending fails
      await otpService.delete(`user_registration:${email}`);
      await otpService.deleteOTP('email_verification', email);

      // Check if it's an invalid email error
      if (
        emailError.message.includes('550') ||
        emailError.message.includes('5.1.1') ||
        emailError.message.includes('NoSuchUser') ||
        emailError.message.includes('Address not found')
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email.',
          errorType: 'INVALID_EMAIL_ADDRESS',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Không thể gửi email xác thực. Vui lòng thử lại sau.',
        errorType: 'EMAIL_SEND_FAILED',
      });
    }
  } catch (error) {
    logger.error('Registration failed', {
      error: error.message,
      email,
    });

    // Cleanup any stored data
    try {
      await otpService.delete(`user_registration:${email}`);
      await otpService.deleteOTP('email_verification', email);
    } catch (cleanupError) {
      logger.error('Cleanup after registration failure failed', {
        error: cleanupError.message,
        email,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Không thể xử lý đăng ký. Vui lòng thử lại sau.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
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
      error: `${VALIDATION.EMAIL_REQUIRED} và ${VALIDATION.PASSWORD_REQUIRED}`,
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: ERRORS.EMAIL_NOT_REGISTERED,
      errorType: ERROR_CODES.EMAIL_NOT_REGISTERED,
    });
  }

  // Check if user can use password authentication
  if (!user.canUsePassword()) {
    return res.status(401).json({
      success: false,
      error: ERRORS.GOOGLE_OAUTH_REQUIRED,
      errorType: ERROR_CODES.GOOGLE_OAUTH_REQUIRED,
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: ERRORS.INVALID_PASSWORD,
      errorType: ERROR_CODES.INVALID_PASSWORD,
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(401).json({
      success: false,
      error: ERRORS.VERIFY_EMAIL_FIRST,
      errorType: 'EMAIL_NOT_VERIFIED',
      requiresEmailVerification: true,
      user: baseUserResponse(user),
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: ERRORS.ACCOUNT_DISABLED,
      errorType: ERROR_CODES.ACCOUNT_DISABLED,
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Create token
  const token = user.getSignedJwtToken();

  logger.info(`User logged in with local auth: ${user.email}`, {
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    token,
    user: baseUserResponse(user),
  });
});

// @desc    Log user out / clear cookie

// @route   POST /api/auth/logout

// @access  Private
const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`, { userId: req.user._id });
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Clear cookie if exists
  if (req.cookies && req.cookies.token) {
    res.clearCookie('token');
  }

  res.status(200).json({ success: true, message: SUCCESS.LOGOUT });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const otpService = getOTPService();
  const otpCooldownService = getOTPCooldownService();
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này',
    });
  }

  // Check cooldown for password reset
  if (otpCooldownService) {
    const inCooldown = await otpCooldownService.isInCooldown(
      'password_reset',
      user.email
    );
    if (inCooldown) {
      const remainingTime = await otpCooldownService.getRemainingCooldown(
        'password_reset',
        user.email
      );
      return res.status(429).json({
        success: false,
        error: `Vui lòng đợi ${Math.ceil(
          remainingTime / 60
        )} phút trước khi yêu cầu OTP mới.`,
        retryAfter: remainingTime,
      });
    }
  }

  // Get reset token and OTP
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetOtp = resetToken.substring(0, 6).toUpperCase();

  // Store OTP in Redis if available, otherwise fallback to database
  if (otpService) {
    try {
      await otpService.storeOTP('password_reset', user.email, resetOtp);
      // Only store hashed token in database for security
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordOtp = undefined; // Clear OTP from database
      user.resetPasswordExpire = undefined; // Clear expiry from database
    } catch (error) {
      logger.error('Failed to store OTP in Redis, falling back to database', {
        error: error.message,
        userId: user._id,
      });
      // Fallback to database storage
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordOtp = resetOtp;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    }
  } else {
    // Fallback to database storage
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  }

  await user.save({ validateBeforeSave: false });

  // Send password reset email with OTP text
  try {
    await EmailService.sendPasswordResetEmail(user, resetOtp);

    logger.info(`Password reset email sent to: ${user.email}`, {
      userId: user._id,
    });

    // Set cooldown after successful email send
    if (otpCooldownService) {
      await otpCooldownService.setCooldown('password_reset', user.email);
    }

    res.status(200).json({
      success: true,
      message: SUCCESS.PASSWORD_RESET_SENT,
    });
  } catch (error) {
    logger.error('Failed to send password reset email', {
      error: error.message,
      userId: user._id,
    });

    res
      .status(500)
      .json({ success: false, error: 'Không thể gửi email đặt lại mật khẩu' });
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
      error: 'Email, OTP và mật khẩu mới là bắt buộc',
    });
  }

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này',
    });
  }

  // Verify OTP from Redis or database
  let otpValid = false;

  const otpService = getOTPService();
  const otpCooldownService = getOTPCooldownService();

  if (otpService) {
    try {
      otpValid = await otpService.verifyAndDeleteOTP(
        'password_reset',
        email,
        otp
      );
    } catch (error) {
      logger.error(
        'Failed to verify OTP from Redis, falling back to database',
        {
          error: error.message,
          userId: user._id,
        }
      );
      // Fallback to database verification
      if (
        user.resetPasswordOtp &&
        user.resetPasswordOtp === otp.toUpperCase()
      ) {
        if (user.resetPasswordExpire && user.resetPasswordExpire < Date.now()) {
          return res.status(400).json({
            success: false,
            error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
          });
        }
        otpValid = true;
      }
    }
  } else {
    // Fallback to database verification
    if (user.resetPasswordOtp && user.resetPasswordOtp === otp.toUpperCase()) {
      if (user.resetPasswordExpire && user.resetPasswordExpire < Date.now()) {
        return res.status(400).json({
          success: false,
          error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
        });
      }
      otpValid = true;
    }
  }

  if (!otpValid) {
    return res.status(400).json({ success: false, error: ERRORS.INVALID_OTP });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordOtp = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`Password reset completed for: ${user.email}`, {
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    message: SUCCESS.PASSWORD_RESET,
    requireLogin: true,
  });
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/login/google
// @access  Public
const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res
      .status(400)
      .json({ success: false, error: MESSAGES.GOOGLE_TOKEN_REQUIRED });
  }

  try {
    const result = await googleAuthService.processGoogleAuth(idToken);
    logger.info(`Google OAuth successful: ${result.user.email}`, {
      userId: result.user.id,
      isNew: result.isNew,
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Google OAuth failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message || 'Xác thực Google thất bại',
    });
  }
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const otpService = getOTPService();

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: VALIDATION.EMAIL_OTP_REQUIRED,
    });
  }

  // Verify OTP with explicit expired vs mismatch handling
  let otpValid = false;
  try {
    // Check existence first to distinguish expiration
    const existingOtp = await otpService.getOTP('email_verification', email);
    if (!existingOtp) {
      return res.status(400).json({
        success: false,
        error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
        expired: true,
      });
    }

    if (existingOtp !== otp.toUpperCase()) {
      return res.status(400).json({
        success: false,
        error: 'Mã OTP không chính xác',
        expired: false,
      });
    }

    // Now consume OTP (delete)
    otpValid = await otpService.verifyAndDeleteOTP(
      'email_verification',
      email,
      otp
    );
  } catch (error) {
    logger.error('Failed to verify OTP', {
      error: error.message,
      email,
    });
    return res.status(400).json({
      success: false,
      error: 'Không thể xác thực mã OTP',
    });
  }

  if (!otpValid) {
    return res.status(400).json({
      success: false,
      error: 'Mã OTP không chính xác',
    });
  }

  // Get stored user data from Redis
  let userData;
  try {
    const userDataString = await otpService.get(`user_registration:${email}`);
    if (!userDataString) {
      return res.status(400).json({
        success: false,
        error: 'Thông tin đăng ký đã hết hạn. Vui lòng đăng ký lại.',
      });
    }
    userData = JSON.parse(userDataString);
  } catch (error) {
    logger.error('Failed to get user data from Redis', {
      error: error.message,
      email,
    });
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy thông tin đăng ký',
    });
  }

  // Create verified user in MongoDB
  try {
    const user = await User.create({
      ...userData,
      isEmailVerified: true,
    });

    // Clean up Redis data
    await otpService.delete(`user_registration:${email}`);

    logger.info(`New user registered and verified: ${email}`);

    res.status(200).json({
      success: true,
      message: SUCCESS.EMAIL_VERIFIED,
      email: user.email,
      isEmailVerified: true,
    });
  } catch (error) {
    logger.error('Failed to create verified user', {
      error: error.message,
      email,
    });
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo tài khoản. Vui lòng thử lại.',
    });
  }
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const otpService = getOTPService();
  const otpCooldownService = getOTPCooldownService();

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email là bắt buộc',
    });
  }

  const user = await User.findOne({ email });
  // Case A: User exists in DB
  if (user) {
    if (user.isEmailVerified) {
      return res
        .status(400)
        .json({ success: false, error: 'Email đã được xác thực' });
    }
    // proceed to generate OTP for existing unverified user (handled below)
  }
  // Case B: User is pending in Redis (pre-registration)
  let pendingRegistration = null;
  if (!user && otpService) {
    try {
      const pending = await otpService.get(`user_registration:${email}`);
      if (pending) pendingRegistration = JSON.parse(pending);
    } catch (e) {
      // ignore parse errors, will fallthrough to 404
    }
  }
  if (!user && !pendingRegistration) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này',
    });
  }
  // Check cooldown for resend verification
  if (otpCooldownService) {
    const inCooldown = await otpCooldownService.isInCooldown(
      'resend_verification',
      email
    );
    if (inCooldown) {
      const remainingTime = await otpCooldownService.getRemainingCooldown(
        'resend_verification',
        email
      );
      return res.status(429).json({
        success: false,
        error: `Vui lòng đợi ${Math.ceil(
          remainingTime
        )} giây trước khi gửi lại OTP.`,
        retryAfter: remainingTime,
      });
    }
  }

  // Generate new verification token and OTP
  const verificationToken = crypto.randomBytes(20).toString('hex');
  const verificationOtp = verificationToken.substring(0, 6).toUpperCase();

  // Store OTP
  if (otpService) {
    const targetEmail = user
      ? user.email
      : pendingRegistration && pendingRegistration.email
      ? pendingRegistration.email
      : email;
    try {
      await otpService.storeOTP(
        'email_verification',
        targetEmail,
        verificationOtp
      );
      if (user) {
        // For existing user, keep hashed token in DB for traceability
        user.emailVerificationToken = crypto
          .createHash('sha256')
          .update(verificationToken)
          .digest('hex');
        user.emailVerificationOtp = undefined;
        user.emailVerificationExpire = undefined;
      } else if (pendingRegistration) {
        // For Redis-only user, update stored registration snapshot with new hashed token
        const updatedPending = {
          ...pendingRegistration,
          verificationToken: crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex'),
        };
        await otpService.setWithExpiry(
          `user_registration:${targetEmail}`,
          JSON.stringify(updatedPending),
          24 * 60 * 60
        );
      }
    } catch (error) {
      logger.error('Failed to store OTP in Redis, falling back to database', {
        error: error.message,
        email,
      });
      if (user) {
        user.emailVerificationToken = crypto
          .createHash('sha256')
          .update(verificationToken)
          .digest('hex');
        user.emailVerificationOtp = verificationOtp;
        user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
      }
    }
  } else if (user) {
    // No Redis, only support DB user
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.emailVerificationOtp = verificationOtp;
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
  }

  if (user) {
    await user.save({ validateBeforeSave: false });
  }
  // Send verification email
  try {
    if (user) {
      await EmailService.sendVerificationEmail(user, verificationOtp);
    } else if (pendingRegistration) {
      await EmailService.sendVerificationEmail(
        { email, fullName: pendingRegistration.fullName },
        verificationOtp
      );
    }
    logger.info('Email verification resent', {
      email,
      userId: user ? user._id : undefined,
      context: user ? 'db_user' : 'redis_pending',
    });

    // Set cooldown after successful email send
    if (otpCooldownService) {
      await otpCooldownService.setCooldown('resend_verification', email);
    }

    res.status(200).json({
      success: true,
      message: SUCCESS.OTP_SENT,
      emailSent: true,
    });
  } catch (error) {
    logger.error('Failed to resend verification email', {
      error: error.message,
      userId: user ? user._id : undefined,
      email,
    });

    // Check if it's a bounce-back or invalid email error
    let errorMessage = 'Không thể gửi email xác thực';
    let errorType = 'EMAIL_SEND_FAILED';

    if (
      error.message.includes('550') ||
      error.message.includes('5.1.1') ||
      error.message.includes('NoSuchUser') ||
      error.message.includes('Address not found')
    ) {
      errorMessage =
        'Email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email.';
      errorType = 'INVALID_EMAIL_ADDRESS';

      logger.warn('Email appears invalid during resend', {
        email,
        userId: user ? user._id : undefined,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      errorType,
      emailSent: false,
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate('candidateProfile')
    .populate('employerProfile');

  res.status(200).json({
    success: true,
    user: baseUserResponse(user),
  });
});

// Get account verification status
const getUnverifiedAccount = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: VALIDATION.EMAIL_REQUIRED,
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          email: email,
          status: 'not_found',
          message: 'Tài khoản chưa được đăng ký',
        },
      });
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        data: {
          email: user.email,
          fullName: user.fullName,
          status: 'verified',
          message: 'Tài khoản đã được xác thực',
          verifiedAt: user.updatedAt,
        },
      });
    }

    // Check if verification has expired
    const now = new Date();
    const verificationExpiry = new Date(
      user.createdAt.getTime() + 24 * 60 * 60 * 1000
    ); // 24 hours

    if (now > verificationExpiry) {
      return res.status(200).json({
        success: true,
        data: {
          email: user.email,
          fullName: user.fullName,
          status: 'expired',
          message: 'Mã xác thực đã hết hạn. Vui lòng đăng ký lại.',
          createdAt: user.createdAt,
          verificationExpiry: verificationExpiry,
        },
      });
    }

    // Return unverified account info
    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        fullName: user.fullName,
        status: 'pending',
        message: 'Tài khoản chưa được xác thực',
        createdAt: user.createdAt,
        verificationExpiry: verificationExpiry,
        timeRemaining: Math.max(
          0,
          verificationExpiry.getTime() - now.getTime()
        ),
      },
    });
  } catch (error) {
    logger.error('Error getting account verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy thông tin tài khoản',
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token là bắt buộc',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token không hợp lệ',
      });
    }

    // Generate new tokens
    const newAccessToken = user.getSignedJwtToken();
    const newRefreshToken = user.getSignedRefreshToken();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
});

// @desc    Request login OTP
// @route   POST /api/auth/request-otp
// @access  Public
const requestLoginOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const otpService = getOTPService();
  const otpCooldownService = getOTPCooldownService();

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Email chưa được đăng ký',
    });
  }

  // Check cooldown
  if (otpCooldownService) {
    const inCooldown = await otpCooldownService.isInCooldown('login', email);
    if (inCooldown) {
      const remainingTime = await otpCooldownService.getRemainingCooldown(
        'login',
        email
      );
      return res.status(429).json({
        success: false,
        error: `Vui lòng đợi ${Math.ceil(
          remainingTime
        )} giây trước khi yêu cầu OTP mới`,
        retryAfter: remainingTime,
      });
    }
  }

  // Generate OTP
  const loginToken = crypto.randomBytes(20).toString('hex');
  const loginOtp = loginToken.substring(0, 6).toUpperCase();

  try {
    if (otpService) {
      await otpService.storeOTP('login', email, loginOtp);
    } else {
      user.loginOtp = loginOtp;
      user.loginOtpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
      await user.save();
    }

    // Send OTP email
    await EmailService.sendLoginOTPEmail(user, loginOtp);

    if (otpCooldownService) {
      await otpCooldownService.setCooldown('login', email);
    }

    res.status(200).json({
      success: true,
      message: SUCCESS.OTP_SENT,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Không thể gửi mã OTP',
    });
  }
});

// @desc    Verify login OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const otpService = getOTPService();
  const otpCooldownService = getOTPCooldownService();

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Email và mã OTP là bắt buộc',
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này',
    });
  }

  // Verify OTP from Redis or database
  let otpValid = false;

  if (otpService) {
    try {
      otpValid = await otpService.verifyAndDeleteOTP('login', email, otp);
    } catch (error) {
      logger.error(
        'Failed to verify OTP from Redis, falling back to database',
        {
          error: error.message,
          userId: user._id,
        }
      );

      if (user.loginOtp && user.loginOtp === otp.toUpperCase()) {
        if (user.loginOtpExpire && user.loginOtpExpire < Date.now()) {
          return res.status(400).json({
            success: false,
            error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
          });
        }
        otpValid = true;
      }
    }
  } else {
    if (user.loginOtp && user.loginOtp === otp.toUpperCase()) {
      if (user.loginOtpExpire && user.loginOtpExpire < Date.now()) {
        return res.status(400).json({
          success: false,
          error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
        });
      }
      otpValid = true;
    }
  }

  if (!otpValid) {
    return res.status(400).json({
      success: false,
      error: 'Mã OTP không chính xác',
    });
  }

  // Clear OTP data
  user.loginOtp = undefined;
  user.loginOtpExpire = undefined;

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = user.getSignedJwtToken();

  logger.info(`User logged in with OTP: ${user.email}`, {
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    token,
    user: baseUserResponse(user),
  });
});

module.exports = {
  register, // POST /register
  login, // POST /login
  loginWithGoogle, // POST /login/google
  requestLoginOTP, // POST /request-otp
  verifyLoginOTP, // POST /verify-otp
  forgotPassword, // POST /forgot-password
  resetPassword, // POST /reset-password
  verifyEmail, // POST /verify-email
  resendEmailVerification, // POST /resend-verification
  refreshToken, // POST /refresh-token
  logout, // POST /logout
  getMe, // GET /me
  getUnverifiedAccount, // GET /unverified-account
};
