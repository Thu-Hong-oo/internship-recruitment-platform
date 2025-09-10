const User = require('../models/User');
const asyncHandler = require('express-async-handler'); //wrapper giúp xử lý lỗi async (không cần try/catch ở mỗi route); khi có lỗi nó gọi next(err) cho Express.
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const googleAuthService = require('../services/googleAuth');
const {
  sendEmailVerification,
  sendPasswordResetEmail,
  createTransporter,
  checkEmailBounceStatus,
} = require('../services/emailService');
const OTPService = require('../services/otpService');
const OTPCooldownService = require('../services/otpCooldownService');
const EmailIssueService = require('../services/emailIssueService');

// Initialize OTP service with Redis client
let otpService = null;
let otpCooldownService = null;

// Function to initialize OTP service
const initializeOTPService = redisClient => {
  if (redisClient) {
    otpService = new OTPService(redisClient);
    otpCooldownService = new OTPCooldownService(redisClient);
    logger.info('OTP Service and Cooldown Service initialized with Redis');
  } else {
    logger.warn(
      'OTP Service initialized without Redis - falling back to database'
    );
  }
};

// Export initialization function - will be added to final exports

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email }); //SELECT * FROM users WHERE email = 'user@example.com' LIMIT 1
  if (existingUser) {
    // If user exists but email is not verified and verification has expired
    if (!existingUser.isEmailVerified && existingUser.emailVerificationExpire && 
        existingUser.emailVerificationExpire < Date.now()) {
      
      logger.info('Deleting unverified user with expired verification', {
        email: email,
        userId: existingUser._id,
        expiredAt: existingUser.emailVerificationExpire,
        timestamp: new Date().toISOString(),
      });
      
      // Delete the unverified user to allow re-registration
      await User.findByIdAndDelete(existingUser._id);
    } else if (existingUser.isEmailVerified) {
      // User exists and email is verified
      return res.status(400).json({
        success: false,
        error: 'Email này đã được sử dụng bởi tài khoản khác',
      });
    } else {
      // User exists but email verification is still valid (not expired)
      return res.status(400).json({
        success: false,
        error: 'Email này đã được đăng ký nhưng chưa xác thực. Vui lòng kiểm tra email để xác thực hoặc đợi hết hạn để đăng ký lại.',
        errorType: 'EMAIL_NOT_VERIFIED'
      });
    }
  }

  // Simple email format validation only
  // Note: We don't check bounce status here to avoid blocking legitimate emails

  // Additional email validation: Check for suspicious patterns
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Địa chỉ email không hợp lệ.',
      errorType: 'INVALID_EMAIL_FORMAT'
    });
  }

  // Check for suspicious email patterns (random strings, etc.)
  const suspiciousPatterns = [
    /^[a-z0-9]{20,}@gmail\.com$/i, // Random long strings
    /^[a-z]{10,}[0-9]{10,}@gmail\.com$/i, // Mixed long strings and numbers
    /^[a-z0-9]{15,}[a-z0-9]{15,}@gmail\.com$/i, // Very long random strings
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(email));
  if (isSuspicious) {
    logger.warn('Suspicious email pattern detected', {
      email: email,
      timestamp: new Date().toISOString(),
    });

    // Log the issue (without userId since user doesn't exist yet)
    await EmailIssueService.logIssue({
      email: email,
      issueType: 'INVALID_EMAIL_ADDRESS',
      errorMessage: 'Suspicious email pattern detected',
      operation: 'REGISTER',
    });

    return res.status(400).json({
      success: false,
      error: 'Email có vẻ không hợp lệ. Vui lòng sử dụng địa chỉ email thực tế.',
      errorType: 'INVALID_EMAIL_ADDRESS'
    });
  }

  // Check cooldown for email verification (registration)
  if (otpCooldownService) {
    const inCooldown = await otpCooldownService.isInCooldown(
      'email_verification',
      email
    );
    if (inCooldown) {
      const remainingTime = await otpCooldownService.getRemainingCooldown(
        'email_verification',
        email
      );
      return res.status(429).json({
        success: false,
        error: `Vui lòng đợi ${Math.ceil(
          remainingTime / 60
        )} phút trước khi thử đăng ký lại.`,
        retryAfter: remainingTime,
      });
    }
  }
  // Validate password for local registration
  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Mật khẩu là bắt buộc khi đăng ký tài khoản',
    });
  }

  // Validate firstName and lastName
  if (!firstName || firstName.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Tên là bắt buộc khi đăng ký tài khoản',
    });
  }

  if (!lastName || lastName.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Họ là bắt buộc khi đăng ký tài khoản',
    });
  }

  // Create user with local authentication
  const user = await User.create({
    email,
    password,
    profile: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    },
    role: role || 'student',
    authMethod: 'local',
    isEmailVerified: false,
  });

  // Generate email verification token and OTP
  const verificationToken = crypto.randomBytes(20).toString('hex');
  const verificationOtp = verificationToken.substring(0, 6).toUpperCase();

  // Store OTP in Redis if available, otherwise fallback to database
  if (otpService) {
    try {
      await otpService.storeOTP(
        'email_verification',
        user.email,
        verificationOtp
      );
      // Only store hashed token in database for security
      user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.emailVerificationOtp = undefined; // Clear OTP from database
      user.emailVerificationExpire = undefined; // Clear expiry from database
    } catch (error) {
      logger.error('Failed to store OTP in Redis, falling back to database', {
        error: error.message,
        userId: user._id,
      });
      // Fallback to database storage
      user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.emailVerificationOtp = verificationOtp;
      user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    }
  } else {
    // Fallback to database storage
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.emailVerificationOtp = verificationOtp;
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  }

  await user.save({ validateBeforeSave: false });

  // Send verification email (email already validated above)
  let emailSent = false;
  let emailError = null;
  let emailStatus = 'unknown';
  
  try {
    await sendEmailVerification(user, verificationToken);
    emailSent = true;
    emailStatus = 'unknown'; // Will be updated by webhook
  } catch (error) {
    logger.error('Failed to send verification email', {
      error: error.message,
      userId: user._id,
      email: user.email,
    });
    
    emailError = error.message;
    
    // Check if it's a bounce-back or invalid email error
    if (error.message.includes('550') || error.message.includes('5.1.1') || 
        error.message.includes('NoSuchUser') || error.message.includes('Address not found') ||
        error.message.includes('The email account that you tried to reach does not exist')) {
      logger.warn('Email address appears to be invalid or non-existent', {
        email: user.email,
        userId: user._id,
        error: error.message,
        errorType: 'INVALID_EMAIL_ADDRESS',
        timestamp: new Date().toISOString(),
      });

      // Log to email issues database
      try {
        await EmailIssueService.logIssue({
          userId: user._id,
          email: user.email,
          issueType: 'INVALID_EMAIL_ADDRESS',
          errorMessage: error.message,
          errorCode: error.code,
          responseCode: error.responseCode,
          operation: 'REGISTER',
        });
      } catch (logError) {
        logger.error('Failed to log email issue to database', {
          error: logError.message,
          userId: user._id,
          email: user.email,
        });
      }
    } else {
      logger.warn('Email sending failed for other reasons', {
        email: user.email,
        userId: user._id,
        error: error.message,
        errorType: 'EMAIL_SEND_FAILED',
        timestamp: new Date().toISOString(),
      });

      // Log to email issues database
      try {
        await EmailIssueService.logIssue({
          userId: user._id,
          email: user.email,
          issueType: 'EMAIL_SEND_FAILED',
          errorMessage: error.message,
          errorCode: error.code,
          responseCode: error.responseCode,
          operation: 'REGISTER',
        });
      } catch (logError) {
        logger.error('Failed to log email issue to database', {
          error: logError.message,
          userId: user._id,
          email: user.email,
        });
      }
    }
  }

  // Update user email status
  user.emailStatus = emailStatus;
  await user.save();

  // Log registration with email status
  logger.info(`New user registered with local auth: ${user.email}`, {
    userId: user._id,
    role: user.role,
    emailSent: emailSent,
    emailError: emailError || null,
    emailStatus: user.emailStatus,
    timestamp: new Date().toISOString(),
  });

  // Prepare response message based on email status
  let message = 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.';
  let warning = null;
  
  if (!emailSent) {
    if (emailError && (emailError.includes('550') || emailError.includes('5.1.1') || 
        emailError.includes('NoSuchUser') || emailError.includes('Address not found'))) {
      warning = 'Email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email.';
    } else {
      warning = 'Không thể gửi email xác thực. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
    }
  }

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.role,
      fullName: user.fullName,
      authMethod: user.authMethod,
      isEmailVerified: user.isEmailVerified,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatar: user.profile.avatar,
      },
    },
    message,
    warning,
    emailSent,
    emailStatus: user.emailStatus,
    emailError: emailError,
  });
});

// @desc    Login user

// @route   POST /api/auth/login

// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: 'Vui lòng cung cấp email và mật khẩu' });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Email này chưa được đăng ký trong hệ thống',
      errorType: 'EMAIL_NOT_REGISTERED',
    });
  }

  // Check if user can use password authentication
  if (!user.canUsePassword()) {
    return res.status(401).json({
      success: false,
      error:
        'Tài khoản này sử dụng Google OAuth. Vui lòng đăng nhập bằng Google.',
      errorType: 'GOOGLE_OAUTH_REQUIRED',
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Mật khẩu không chính xác',
      errorType: 'INVALID_PASSWORD',
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(401).json({
      success: false,
      error:
        'Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập.',
      errorType: 'EMAIL_NOT_VERIFIED',
      requiresEmailVerification: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        role: user.role,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
        authMethod: user.authMethod,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          avatar: user.profile.avatar,
        },
      },
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Tài khoản đã bị vô hiệu hóa',
      errorType: 'ACCOUNT_DISABLED',
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Create token
  const token = user.getSignedJwtToken();

  logger.info(`User logged in with local auth: ${user.email}`, {
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.role,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      authMethod: user.authMethod,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatar: user.profile.avatar,
      },
    },
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

  res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
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

  // Send password reset email
  try {
    await sendPasswordResetEmail(user, resetToken);

    logger.info(`Password reset email sent to: ${user.email}`, {
      userId: user._id,
    });

    // Set cooldown after successful email send
    if (otpCooldownService) {
      await otpCooldownService.setCooldown('password_reset', user.email);
    }

    res.status(200).json({
      success: true,
      message: 'Email đặt lại mật khẩu đã được gửi thành công',
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
    return res
      .status(400)
      .json({ success: false, error: 'Mã OTP không chính xác' });
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

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
  });
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res
      .status(400)
      .json({ success: false, error: 'Google ID token là bắt buộc' });
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

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, error: 'Email và mã OTP là bắt buộc' });
  }

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này',
    });
  }

  if (user.isEmailVerified) {
    return res
      .status(400)
      .json({ success: false, error: 'Email đã được xác thực trước đó' });
  }

  // Verify OTP from Redis or database
  let otpValid = false;

  if (otpService) {
    try {
      otpValid = await otpService.verifyAndDeleteOTP(
        'email_verification',
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
      const expectedOtp = user.emailVerificationOtp;
      if (expectedOtp && expectedOtp === otp.toUpperCase()) {
        if (
          user.emailVerificationExpire &&
          user.emailVerificationExpire < Date.now()
        ) {
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
    const expectedOtp = user.emailVerificationOtp;
    if (expectedOtp && expectedOtp === otp.toUpperCase()) {
      if (
        user.emailVerificationExpire &&
        user.emailVerificationExpire < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
        });
      }
      otpValid = true;
    }
  }
  if (!otpValid) {
    logger.error('OTP verification failed', {
      userId: user._id,
      email: user.email,
      providedOtp: otp.toUpperCase(),
    });
    return res
      .status(400)
      .json({ success: false, error: 'Mã OTP không chính xác' });
  }

  // Set email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationOtp = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  // Create new token after email verification
  const token = user.getSignedJwtToken();

  logger.info(`Email verified with OTP for user: ${user.email}`, {
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    token,
    message: 'Xác thực email thành công',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.role,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      authMethod: user.authMethod,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatar: user.profile.avatar,
      },
    },
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email là bắt buộc',
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài khoản với email này',
    });
  }
  if (user.isEmailVerified) {
    return res
      .status(400)
      .json({ success: false, error: 'Email đã được xác thực' });
  }
  // Check cooldown for resend verification
  if (otpCooldownService) {
    const inCooldown = await otpCooldownService.isInCooldown(
      'resend_verification',
      user.email
    );
    if (inCooldown) {
      const remainingTime = await otpCooldownService.getRemainingCooldown(
        'resend_verification',
        user.email
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

  // Store OTP in Redis if available, otherwise fallback to database
  if (otpService) {
    try {
      await otpService.storeOTP(
        'email_verification',
        user.email,
        verificationOtp
      );
      // Only store hashed token in database for security
      user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.emailVerificationOtp = undefined; // Clear OTP from database
      user.emailVerificationExpire = undefined; // Clear expiry from database
    } catch (error) {
      logger.error('Failed to store OTP in Redis, falling back to database', {
        error: error.message,
        userId: user._id,
      });
      // Fallback to database storage
      user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.emailVerificationOtp = verificationOtp;
      user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    }
  } else {
    // Fallback to database storage
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.emailVerificationOtp = verificationOtp;
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  }

  await user.save({ validateBeforeSave: false });
  // Send verification email
  try {
    await sendEmailVerification(user, verificationToken);
    logger.info(`Email verification resent to: ${user.email}`, {
      userId: user._id,
    });

    // Set cooldown after successful email send
    if (otpCooldownService) {
      await otpCooldownService.setCooldown('resend_verification', user.email);
    }
    
    res.status(200).json({
      success: true,
      message: 'Email xác thực đã được gửi thành công',
      emailSent: true,
    });
  } catch (error) {
    logger.error('Failed to resend verification email', {
      error: error.message,
      userId: user._id,
      email: user.email,
    });

    // Check if it's a bounce-back or invalid email error
    let errorMessage = 'Không thể gửi email xác thực';
    let errorType = 'EMAIL_SEND_FAILED';
    
    if (error.message.includes('550') || error.message.includes('5.1.1') || 
        error.message.includes('NoSuchUser') || error.message.includes('Address not found')) {
      errorMessage = 'Email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email.';
      errorType = 'INVALID_EMAIL_ADDRESS';
      
      logger.warn('Email address appears to be invalid or non-existent during resend', {
        email: user.email,
        userId: user._id,
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

// @desc    Validate email address
// @route   POST /api/auth/validate-email
// @access  Public
const validateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email là bắt buộc',
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Định dạng email không hợp lệ',
      errorType: 'INVALID_EMAIL_FORMAT',
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Email này đã được sử dụng',
      errorType: 'EMAIL_ALREADY_EXISTS',
    });
  }

  // Try to send a test email to validate if the address exists
  try {
    const transporter = createTransporter();
    
    // Send a test email (this will bounce if email doesn't exist)
    const testMailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Test Email - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Test Email</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Đây là email test để kiểm tra tính hợp lệ của địa chỉ email.</p>
            <p>Nếu bạn nhận được email này, địa chỉ email của bạn là hợp lệ.</p>
            <p>Bạn có thể bỏ qua email này.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(testMailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Email hợp lệ và có thể nhận thư',
      emailValid: true,
    });
  } catch (error) {
    logger.error('Email validation failed', {
      error: error.message,
      email: email,
      errorCode: error.code,
      responseCode: error.responseCode,
    });

    // Check if it's a bounce-back or invalid email error
    if (error.message.includes('550') || error.message.includes('5.1.1') || 
        error.message.includes('NoSuchUser') || error.message.includes('Address not found')) {
      return res.status(400).json({
        success: false,
        error: 'Email không tồn tại hoặc không thể nhận thư',
        errorType: 'EMAIL_NOT_EXISTS',
        emailValid: false,
      });
    }

    // For other errors, we can't determine if email is valid
    res.status(200).json({
      success: true,
      message: 'Không thể kiểm tra email, nhưng định dạng hợp lệ',
      emailValid: null, // Unknown
      warning: 'Có thể có vấn đề với dịch vụ email',
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
    user: {
      id: user._id,
      email: user.email,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      role: user.role,
      fullName: user.fullName,
      authMethod: user.authMethod,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      candidateProfile: user.candidateProfile,
      employerProfile: user.employerProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        phone: user.profile?.phone,
        avatar: user.profile?.avatar,
        bio: user.profile?.bio,
        location: user.profile?.location,
        dateOfBirth: user.profile?.dateOfBirth,
        gender: user.profile?.gender,
      },
      preferences: user.preferences,
    },
  });
});

// Get unverified account info
const getUnverifiedAccount = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài khoản với email này'
      });
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản đã được xác thực'
      });
    }

    // Check if verification has expired
    const now = new Date();
    const verificationExpiry = new Date(user.createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    if (now > verificationExpiry) {
      return res.status(400).json({
        success: false,
        error: 'Mã xác thực đã hết hạn. Vui lòng đăng ký lại.',
        expired: true
      });
    }

    // Return unverified account info
    res.json({
      success: true,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        verificationExpiry: verificationExpiry,
        timeRemaining: Math.max(0, verificationExpiry.getTime() - now.getTime())
      }
    });

  } catch (error) {
    logger.error('Error getting unverified account:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy thông tin tài khoản'
    });
  }
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  verifyEmail,
  resendEmailVerification,
  validateEmail,
  getUnverifiedAccount,
  initializeOTPService,
};
