const User = require('../../infrastructure/models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('../../shared/utils/logger');
const googleAuthService = require('../../infrastructure/services/external/core/GoogleAuthService');
const EmailService = require('../../infrastructure/services/external/core/EmailService');
const UserResponseDTO = require('../dtos/UserResponseDTO');
const {
  OTP,
  VALIDATION,
  ERRORS,
  SUCCESS,
  ERROR_CODES,
} = require('../../shared/constants/auth.constants');
const {
  getOTPService,
  getOTPCooldownService,
} = require('../../infrastructure/config/initializeServices');

// Constants for magic numbers
const OTP_EXPIRY = {
  PASSWORD_RESET: 10 * 60 * 1000, // 10 minutes
  EMAIL_VERIFICATION: 10 * 60 * 1000, // 10 minutes
  LOGIN: 5 * 60 * 1000, // 5 minutes
};

const REGISTRATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Helper function to standardize error responses
 * @param {string} errorType - Error type constant
 * @param {string} message - Error message
 * @param {Object} additionalData - Additional error data
 * @returns {Object} - Standardized error response
 */
const createErrorResponse = (errorType, message, additionalData = {}) => {
  return {
    success: false,
    error: message,
    errorType: ERROR_CODES[errorType] || errorType,
    ...additionalData,
  };
};

const resolveFullName = user => {
  // The virtual 'displayFullName' now handles this logic.
  // Ensure the user object is populated with the relevant profile.
  return user.displayFullName || user.email.split('@')[0];
};

/**
 * Transform infrastructure user model to presentation DTO
 * @param {Object} user - Infrastructure User model instance
 * @returns {Object} - User response DTO
 */
const transformUserToResponse = user => {
  // Create DTO from infrastructure data (temporary until full domain integration)
  const dto = new UserResponseDTO(
    {
      userId: user._id,
      fullName: resolveFullName(user),
      email: user.email,
      avatarUrl: user.avatarUrl,
      status: user.status,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    {
      role: user.role,
      authMethod: user.authMethod,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      googleProfile: user.googleProfile,
      preferences: user.preferences,
      lastLogin: user.lastLogin,
      candidateProfile: user.candidateProfile,
      employerProfile: user.employerProfile,
    }
  );

  return dto.toJSON();
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  const fullName = `${firstName} ${lastName}`.trim();
  const otpService = getOTPService();

  if (!otpService) {
    return res.status(500).json({
      success: false,
      error: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
    });
  }

  try {
    // Get use case from Awilix container
    const registerUserUseCase = req.container.resolve(
      'registerCandidateUseCase'
    );

    const result = await registerUserUseCase.execute({
      email,
      password,
      fullName,
      role,
    });

    res.status(201).json({
      success: true,
      message: SUCCESS.REGISTER,
      email: result.email,
      emailSent: result.emailSent,
    });
  } catch (error) {
    logger.error('Registration failed', {
      error: error.message,
      email,
    });

    // Map business errors to appropriate responses
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(400).json({
        success: false,
        error: ERRORS.EMAIL_EXISTS,
        errorType: ERROR_CODES.EMAIL_ALREADY_EXISTS,
      });
    }

    if (error.message === 'REGISTRATION_IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error:
          'Email này đang trong quá trình đăng ký. Vui lòng kiểm tra email để xác thực hoặc đợi 24 giờ để đăng ký lại.',
        errorType: ERROR_CODES.CONFLICT,
      });
    }

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
      errorType: ERROR_CODES.INTERNAL_ERROR,
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
    logger.warn('Login attempt with missing email or password', {
      email: email ? 'provided' : 'missing',
    });
    return res.status(400).json({
      success: false,
      error: `${VALIDATION.EMAIL_REQUIRED} và ${VALIDATION.PASSWORD_REQUIRED}`,
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    const result = await req.container.resolve('loginUseCase').execute({
      email,
      password,
    });

    res.status(200).json({
      success: true,
      token: result.token,
      user: transformUserToResponse(result.user),
    });
  } catch (error) {
    // Map business errors to appropriate responses
    if (error.message === 'EMAIL_NOT_REGISTERED') {
      logger.warn('Login attempt with unregistered email', { email });
      return res.status(401).json({
        success: false,
        errorType: ERROR_CODES.EMAIL_NOT_REGISTERED,
      });
    }

    if (error.message === 'GOOGLE_OAUTH_REQUIRED') {
      logger.warn('Login attempt with password for OAuth user', { email });
      return res.status(401).json({
        success: false,
        errorType: ERROR_CODES.GOOGLE_OAUTH_REQUIRED,
      });
    }

    if (error.message === 'INVALID_PASSWORD') {
      logger.warn('Login attempt with wrong password', { email });
      return res.status(401).json({
        success: false,
        errorType: ERROR_CODES.INVALID_PASSWORD,
      });
    }

    if (error.message === 'EMAIL_NOT_VERIFIED') {
      logger.warn('Login attempt with unverified email', { email });
      return res.status(401).json({
        success: false,
        error: ERRORS.VERIFY_EMAIL_FIRST,
        errorType: 'EMAIL_NOT_VERIFIED',
        requiresEmailVerification: true,
        user: transformUserToResponse(
          await User.findOne({ email }).select(
            '+fullName +avatar +googleProfile +preferences +lastLogin +candidateProfile +employerProfile'
          )
        ),
      });
    }

    if (error.message === 'ACCOUNT_DISABLED') {
      logger.warn('Login attempt for inactive user', { email });
      return res.status(401).json({
        success: false,
        errorType: ERROR_CODES.ACCOUNT_DISABLED,
      });
    }

    // Unexpected error
    logger.error('Login failed with unexpected error', {
      error: error.message,
      email,
    });
    return res.status(500).json({
      success: false,
      error: 'Đăng nhập thất bại. Vui lòng thử lại sau.',
      errorType: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

// @desc    Log user out / clear cookie

// @route   POST /api/auth/logout

// @access  Private
// Logout user
const logout = asyncHandler(async (req, res) => {
  try {
    // Logout functionality not implemented in current use cases
    // await req.container.resolve('logoutUseCase').execute({ user: req.user });

    // Clear cookie if exists
    if (req.cookies && req.cookies.token) {
      res.clearCookie('token');
    }

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi đăng xuất',
      errorType: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const otpService = getOTPService();
  const otpCooldownService = getOTPCooldownService();

  try {
    const result = await req.container
      .resolve('requestPasswordResetUseCase')
      .execute({
        email: req.body.email,
      });

    res.status(200).json({
      success: true,
      message: SUCCESS.PASSWORD_RESET_SENT,
      ...result,
    });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res
        .status(404)
        .json(
          createErrorResponse(
            'NOT_FOUND',
            'Không tìm thấy tài khoản với email này'
          )
        );
    }
    if (error.message.startsWith('COOLDOWN_ACTIVE:')) {
      const remainingTime = error.message.split(':')[1];
      return res.status(429).json({
        success: false,
        error: `Vui lòng đợi ${Math.ceil(
          remainingTime / 60
        )} phút trước khi yêu cầu OTP mới.`,
        retryAfter: remainingTime,
      });
    }
    logger.error('Failed to process forgot password', {
      error: error.message,
      email: req.body.email,
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
    logger.warn('Reset password attempt with missing fields', {
      email,
      hasOtp: !!otp,
      hasPassword: !!password,
    });
    return res
      .status(400)
      .json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Email, OTP và mật khẩu mới là bắt buộc'
        )
      );
  }

  try {
    const result = await req.container.resolve('resetPasswordUseCase').execute({
      email,
      otp,
      password,
    });

    res.status(200).json({
      success: true,
      message: SUCCESS.PASSWORD_RESET,
      ...result,
    });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res
        .status(404)
        .json(
          createErrorResponse(
            'NOT_FOUND',
            'Không tìm thấy tài khoản với email này'
          )
        );
    }
    if (error.message === 'OTP_EXPIRED') {
      return res
        .status(400)
        .json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới'
          )
        );
    }
    if (error.message === 'INVALID_OTP') {
      return res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', ERRORS.INVALID_OTP));
    }
    logger.error('Reset password failed', { error: error.message, email });
    res
      .status(500)
      .json({ success: false, error: 'Không thể đặt lại mật khẩu' });
  }
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/login/google
// @access  Public
const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    logger.warn('Google OAuth attempt with missing token');
    return res.status(400).json({
      success: false,
      error: 'Google token là bắt buộc',
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    // Google login not implemented in current use cases - temporarily return error
    res.status(501).json({
      success: false,
      error: 'Google login chưa được triển khai',
      errorType: ERROR_CODES.NOT_IMPLEMENTED,
    });
  } catch (error) {
    logger.error('Google OAuth failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message || 'Xác thực Google thất bại',
      errorType: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
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
    logger.warn('Verify email attempt with missing email or OTP', {
      email,
      hasOtp: !!otp,
    });
    return res.status(400).json({
      success: false,
      error: VALIDATION.EMAIL_OTP_REQUIRED,
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    const result = await req.container
      .resolve('verifyEmailUseCase')
      .execute({ email, otp });

    // Create user profile after successful verification
    try {
      const registerUserUseCase = req.container.resolve('registerUserUseCase');
      await registerUserUseCase.createUserProfile(email, result.role);
      logger.info(`Auto-created ${result.role} profile for: ${email}`);
    } catch (profileError) {
      logger.error('Failed to auto-create profile after verification', {
        error: profileError.message,
        email,
        role: result.role,
      });
      // Don't fail the verification - user can create profile manually later
    }

    res.status(200).json({
      success: true,
      message: SUCCESS.EMAIL_VERIFIED,
      email: result.email,
      isEmailVerified: result.isEmailVerified,
      role: result.role,
      profileCreated: true,
    });
  } catch (error) {
    // Map business errors to appropriate responses
    if (error.message === 'OTP_EXPIRED') {
      return res.status(400).json({
        success: false,
        error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
        expired: true,
        errorType: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    if (error.message === 'INVALID_OTP') {
      return res.status(400).json({
        success: false,
        error: 'Mã OTP không chính xác',
        expired: false,
        errorType: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    if (error.message === 'OTP_VERIFICATION_FAILED') {
      return res.status(400).json({
        success: false,
        error: 'Không thể xác thực mã OTP',
        errorType: ERROR_CODES.INTERNAL_ERROR,
      });
    }

    if (error.message === 'REGISTRATION_EXPIRED') {
      return res.status(400).json({
        success: false,
        error: 'Thông tin đăng ký đã hết hạn. Vui lòng đăng ký lại.',
        errorType: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    if (error.message === 'REGISTRATION_DATA_ERROR') {
      return res.status(500).json({
        success: false,
        error: 'Không thể lấy thông tin đăng ký',
        errorType: ERROR_CODES.INTERNAL_ERROR,
      });
    }

    if (error.message === 'USER_CREATION_FAILED') {
      return res.status(500).json({
        success: false,
        error: 'Không thể tạo tài khoản. Vui lòng thử lại.',
        errorType: ERROR_CODES.INTERNAL_ERROR,
      });
    }

    // Unexpected error
    logger.error('Email verification failed with unexpected error', {
      error: error.message,
      email,
    });
    return res.status(500).json({
      success: false,
      error: 'Xác thực email thất bại. Vui lòng thử lại sau.',
      errorType: ERROR_CODES.INTERNAL_ERROR,
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
    logger.warn('Resend verification attempt with missing email');
    return res.status(400).json({
      success: false,
      error: 'Email là bắt buộc',
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    // Check if user exists in MongoDB (already registered and verified/unverified)
    let existingUser = await User.findOne({ email });
    let userData = null;
    let fullName = 'User';

    if (existingUser) {
      // User exists in MongoDB
      // Check if already verified
      if (existingUser.isEmailVerified) {
        logger.info('Resend verification attempt for already verified email', {
          email,
        });
        throw new Error('EMAIL_ALREADY_VERIFIED');
      }
      fullName = existingUser.fullName || 'User';
    } else {
      // User not in MongoDB, check Redis for pending registration
      const userDataString = await otpService.get(`user_registration:${email}`);
      if (!userDataString) {
        logger.warn('Resend verification attempt for non-existent email', {
          email,
        });
        throw new Error('USER_NOT_FOUND');
      }

      // Parse user data from Redis
      userData = JSON.parse(userDataString);
      fullName = userData.fullName || 'User';
      logger.info('Found pending registration in Redis', { email });
    }

    // Check cooldown
    if (!otpCooldownService) {
      logger.warn(
        'OTP cooldown service not available, skipping cooldown check'
      );
    } else {
      const cooldownRemaining = await otpCooldownService.getRemainingCooldown(
        'email_verification',
        email
      );
      if (cooldownRemaining > 0) {
        logger.warn('Resend verification blocked by cooldown', {
          email,
          remainingTime: cooldownRemaining,
        });
        throw new Error(`COOLDOWN_ACTIVE:${cooldownRemaining}`);
      }
    }

    // Generate new OTP (same logic as RegisterUserUseCase)
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationOtp = verificationToken.substring(0, 6).toUpperCase();

    // Store OTP in Redis
    await otpService.storeOTP('email_verification', email, verificationOtp);

    // Set cooldown
    if (otpCooldownService) {
      await otpCooldownService.setCooldown('email_verification', email);
    }

    // Send verification email
    await EmailService.sendVerificationEmail(
      { email, fullName },
      verificationOtp
    );

    logger.info('Verification email resent successfully', { email });

    res.status(200).json({
      success: true,
      message:
        'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.',
      data: {
        email,
        expiresIn: 600,
      },
    });
  } catch (error) {
    if (error.message === 'EMAIL_ALREADY_VERIFIED') {
      return res
        .status(400)
        .json({ success: false, error: 'Email đã được xác thực' });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài khoản với email này',
        errorType: ERROR_CODES.NOT_FOUND,
      });
    }
    if (error.message.startsWith('COOLDOWN_ACTIVE:')) {
      const remainingTime = error.message.split(':')[1];
      return res.status(429).json({
        success: false,
        error: `Vui lòng đợi ${Math.ceil(
          remainingTime
        )} giây trước khi gửi lại OTP.`,
        retryAfter: remainingTime,
      });
    }
    logger.error('Resend verification failed', { error: error.message, email });
    res.status(500).json({
      success: false,
      error: 'Không thể gửi email xác thực',
      errorType: 'EMAIL_SEND_FAILED',
      emailSent: false,
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  try {
    logger.info(`Getting user info for userId: ${req.user.id}`);

    if (!req.user || !req.user.id) {
      logger.error('No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed - no user ID',
        errorType: ERROR_CODES.AUTHENTICATION_ERROR,
      });
    }

    // Get me not implemented yet - temporarily return static user data
    const user = {
      _id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      status: 'active',
      isEmailVerified: req.user.isEmailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!user) {
      logger.error(`User not found for ID: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorType: ERROR_CODES.NOT_FOUND,
      });
    }

    logger.info(`Successfully retrieved user info for: ${user.email}`);
    res.status(200).json({
      success: true,
      user: transformUserToResponse(user),
    });
  } catch (error) {
    logger.error('Error in getMe controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorType: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

// Get account verification status
const getUnverifiedAccount = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    logger.warn('Get unverified account attempt with missing email');
    return res.status(400).json({
      success: false,
      error: VALIDATION.EMAIL_REQUIRED,
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    // Get unverified account not implemented yet
    res.status(501).json({
      success: false,
      error: 'Get unverified account chưa được triển khai',
    });
  } catch (error) {
    logger.error('Error getting account verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy thông tin tài khoản',
      errorType: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
// Refresh access token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    logger.warn('Refresh token attempt with missing token');
    return res.status(400).json({
      success: false,
      error: VALIDATION.REFRESH_TOKEN_REQUIRED,
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    const data = await req.container.resolve('refreshTokenUseCase').execute({
      refreshToken: token,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Lỗi server khi làm mới token',
      errorType: ERROR_CODES.AUTHENTICATION_ERROR,
    });
  }
});

// @desc    Request login OTP
// @route   POST /api/auth/request-otp
// @access  Public
// Request login OTP
const requestLoginOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    logger.warn('Request login OTP attempt with missing email');
    return res.status(400).json({
      success: false,
      error: VALIDATION.EMAIL_REQUIRED,
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    // Request login OTP not implemented yet
    res.status(501).json({
      success: false,
      error: 'Request login OTP chưa được triển khai',
    });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Email chưa được đăng ký',
        errorType: ERROR_CODES.NOT_FOUND,
      });
    }
    if (error.message === 'COOLDOWN_ACTIVE') {
      return res.status(429).json({
        success: false,
        error: error.details || 'Vui lòng đợi trước khi yêu cầu OTP mới',
        retryAfter: error.retryAfter || 60,
      });
    }
    logger.error('Error requesting login OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể gửi mã OTP',
      errorType: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    });
  }
});

// @desc    Verify login OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// Verify login OTP
const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    logger.warn('Verify login OTP attempt with missing fields', {
      email,
      hasOtp: !!otp,
    });
    return res.status(400).json({
      success: false,
      error: 'Email và mã OTP là bắt buộc',
      errorType: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  try {
    // Verify login OTP not implemented yet
    res.status(501).json({
      success: false,
      error: 'Verify login OTP chưa được triển khai',
    });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài khoản với email này',
        errorType: ERROR_CODES.NOT_FOUND,
      });
    }
    if (error.message === 'INVALID_OTP') {
      return res.status(400).json({
        success: false,
        error: 'Mã OTP không chính xác',
        errorType: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    if (error.message === 'OTP_EXPIRED') {
      return res.status(400).json({
        success: false,
        error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
        errorType: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    logger.error('Error verifying login OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xác thực mã OTP',
      errorType: ERROR_CODES.INTERNAL_ERROR,
    });
  }
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
