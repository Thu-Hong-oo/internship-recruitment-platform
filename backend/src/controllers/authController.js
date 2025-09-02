const User = require( '../models/User' );
const asyncHandler = require( 'express-async-handler' );//wrapper giúp xử lý lỗi async (không cần try/catch ở mỗi route); khi có lỗi nó gọi next(err) cho Express.
const jwt = require( 'jsonwebtoken' );
const crypto = require( 'crypto' );
const { logger } = require( '../utils/logger' );
const googleAuthService = require( '../services/googleAuth' );
const { sendEmailVerification, sendPasswordResetEmail } = require( '../services/emailService' );
const OTPService = require( '../services/otpService' );
const OTPCooldownService = require( '../services/otpCooldownService' );

// Initialize OTP service with Redis client
let otpService = null;
let otpCooldownService = null;

// Function to initialize OTP service
const initializeOTPService = (redisClient) => {
  if (redisClient) {
    otpService = new OTPService(redisClient);
    otpCooldownService = new OTPCooldownService(redisClient);
    logger.info('OTP Service and Cooldown Service initialized with Redis');
  } else {
    logger.warn('OTP Service initialized without Redis - falling back to database');
  }
};

// Export initialization function - will be added to final exports

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler( async ( req, res ) => {
    const {
        email,
        password,
        firstName,
        lastName,
        role
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne( { email } );
    if ( existingUser ) {
        return res.status( 400 ).json( { success: false, error: 'Email này đã được sử dụng bởi tài khoản khác' } );
    }

    // Check cooldown for email verification (registration)
    if (otpCooldownService) {
      const inCooldown = await otpCooldownService.isInCooldown('email_verification', email);
      if (inCooldown) {
        const remainingTime = await otpCooldownService.getRemainingCooldown('email_verification', email);
        return res.status(429).json({
          success: false,
          error: `Vui lòng đợi ${Math.ceil(remainingTime / 60)} phút trước khi thử đăng ký lại.`,
          retryAfter: remainingTime
        });
      }
    }
    // Validate password for local registration
    if ( !password ) {
        return res.status( 400 ).json( { success: false, error: 'Mật khẩu là bắt buộc khi đăng ký tài khoản' } );
    }
    // Create user with local authentication
    const user = await User.create( {

        email,
        password,
        firstName,
        lastName,
        role: role || 'student',
        authMethod: 'local',
        isEmailVerified: false

    } );

    // Generate email verification token and OTP
    const verificationToken = crypto.randomBytes( 20 ).toString( 'hex' );
    const verificationOtp = verificationToken.substring( 0, 6 ).toUpperCase();

    // Store OTP in Redis if available, otherwise fallback to database
    if (otpService) {
      try {
        await otpService.storeOTP('email_verification', user.email, verificationOtp);
        // Only store hashed token in database for security
        user.emailVerificationToken = crypto.createHash( 'sha256' ).update( verificationToken ).digest( 'hex' );
        user.emailVerificationOtp = undefined; // Clear OTP from database
        user.emailVerificationExpire = undefined; // Clear expiry from database
      } catch (error) {
        logger.error('Failed to store OTP in Redis, falling back to database', {
          error: error.message,
          userId: user._id
        });
        // Fallback to database storage
        user.emailVerificationToken = crypto.createHash( 'sha256' ).update( verificationToken ).digest( 'hex' );
        user.emailVerificationOtp = verificationOtp;
        user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      }
    } else {
      // Fallback to database storage
      user.emailVerificationToken = crypto.createHash( 'sha256' ).update( verificationToken ).digest( 'hex' );
      user.emailVerificationOtp = verificationOtp;
      user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    }
    
    await user.save( { validateBeforeSave: false } );

    // Send verification email
    try {

        await sendEmailVerification( user, verificationToken );

    } catch ( error ) {

        logger.error( 'Failed to send verification email', {

            error: error.message,
            userId: user._id

        } );

        // Don't fail registration if email fails, just log it
    }

    logger.info( `New user registered with local auth: ${
        user.email
    }`, {

        userId: user._id,
        role: user.role

    } );

    res.status( 201 ).json( {

        success: true,
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

    } );

} );

// @desc    Login user

// @route   POST /api/auth/login

// @access  Public
const login = asyncHandler( async ( req, res ) => {

    const { email, password } = req.body;

    // Validate email & password
    if ( !email || !password ) {

        return res.status( 400 ).json( { success: false, error: 'Vui lòng cung cấp email và mật khẩu' } );

    }

    // Check for user
    const user = await User.findOne( { email } ).select( '+password' );

    if ( ! user ) {

        return res.status( 401 ).json( { success: false, error: 'Email này chưa được đăng ký trong hệ thống', errorType: 'EMAIL_NOT_REGISTERED' } );

    }

    // Check if user can use password authentication
    if ( ! user.canUsePassword() ) {

        return res.status( 401 ).json( { success: false, error: 'Tài khoản này sử dụng Google OAuth. Vui lòng đăng nhập bằng Google.', errorType: 'GOOGLE_OAUTH_REQUIRED' } );

    }

    // Check if password matches
    const isMatch = await user.matchPassword( password );

    if ( ! isMatch ) {

        return res.status( 401 ).json( { success: false, error: 'Mật khẩu không chính xác', errorType: 'INVALID_PASSWORD' } );

    }

    // Check if email is verified
    if ( ! user.isEmailVerified ) {

        return res.status( 401 ).json( {

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

        } );

    }

    // Check if user is active
    if ( ! user.isActive ) {

        return res.status( 401 ).json( { success: false, error: 'Tài khoản đã bị vô hiệu hóa', errorType: 'ACCOUNT_DISABLED' } );

    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token
    const token = user.getSignedJwtToken();

    logger.info( `User logged in with local auth: ${
        user.email
    }`, { userId: user._id } );

    res.status( 200 ).json( {

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

    } );

} );


// @desc    Log user out / clear cookie

// @route   POST /api/auth/logout

// @access  Private
const logout = asyncHandler( async ( req, res ) => {

    logger.info( `User logged out: ${
        req.user.email
    }`, { userId: req.user._id } );
    let token;
    if ( req.headers.authorization && req.headers.authorization.startsWith( 'Bearer' ) ) {

        token = req.headers.authorization.split( ' ' )[ 1 ];

    } else if ( req.cookies && req.cookies.token ) {

        token = req.cookies.token;

    }

    // Clear cookie if exists
    if ( req.cookies && req.cookies.token ) {

        res.clearCookie( 'token' );

    }

    res.status( 200 ).json( { success: true, message: 'Đăng xuất thành công' } );

} );


// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler( async ( req, res ) => {

    const user = await User.findOne( { email: req.body.email } );

    if ( ! user ) {

        return res.status( 404 ).json( { success: false, error: 'Không tìm thấy tài khoản với email này' } );

    }

    // Check cooldown for password reset
    if (otpCooldownService) {
      const inCooldown = await otpCooldownService.isInCooldown('password_reset', user.email);
      if (inCooldown) {
        const remainingTime = await otpCooldownService.getRemainingCooldown('password_reset', user.email);
        return res.status(429).json({
          success: false,
          error: `Vui lòng đợi ${Math.ceil(remainingTime / 60)} phút trước khi yêu cầu OTP mới.`,
          retryAfter: remainingTime
        });
      }
    }

    // Get reset token and OTP
    const resetToken = crypto.randomBytes( 20 ).toString( 'hex' );
    const resetOtp = resetToken.substring( 0, 6 ).toUpperCase();

    // Store OTP in Redis if available, otherwise fallback to database
    if (otpService) {
      try {
        await otpService.storeOTP('password_reset', user.email, resetOtp);
        // Only store hashed token in database for security
        user.resetPasswordToken = crypto.createHash( 'sha256' ).update( resetToken ).digest( 'hex' );
        user.resetPasswordOtp = undefined; // Clear OTP from database
        user.resetPasswordExpire = undefined; // Clear expiry from database
      } catch (error) {
        logger.error('Failed to store OTP in Redis, falling back to database', {
          error: error.message,
          userId: user._id
        });
        // Fallback to database storage
        user.resetPasswordToken = crypto.createHash( 'sha256' ).update( resetToken ).digest( 'hex' );
        user.resetPasswordOtp = resetOtp;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      }
    } else {
      // Fallback to database storage
      user.resetPasswordToken = crypto.createHash( 'sha256' ).update( resetToken ).digest( 'hex' );
      user.resetPasswordOtp = resetOtp;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    }

    await user.save( { validateBeforeSave: false } );

    // Send password reset email
    try {

        await sendPasswordResetEmail( user, resetToken );

        logger.info( `Password reset email sent to: ${
            user.email
        }`, { userId: user._id } );

        // Set cooldown after successful email send
        if (otpCooldownService) {
          await otpCooldownService.setCooldown('password_reset', user.email);
        }

        res.status( 200 ).json( { success: true, message: 'Email đặt lại mật khẩu đã được gửi thành công' } );

    } catch ( error ) {

        logger.error( 'Failed to send password reset email', {

            error: error.message,
            userId: user._id

        } );

        res.status( 500 ).json( { success: false, error: 'Không thể gửi email đặt lại mật khẩu' } );

    }

} );

// @desc    Reset password with OTP

// @route   PUT /api/auth/resetpassword

// @access  Public
const resetPassword = asyncHandler(async ( req, res ) => {

    const { email, otp, password } = req.body;

    if ( !email || !otp || !password ) {

        return res.status( 400 ).json( { success: false, error: 'Email, OTP và mật khẩu mới là bắt buộc' } );

    }

    // Find user by email
    const user = await User.findOne( { email } );

    if ( ! user ) {

        return res.status( 404 ).json( { success: false, error: 'Không tìm thấy tài khoản với email này' } );

    }

    // Verify OTP from Redis or database
    let otpValid = false;
    
    if (otpService) {
      try {
        otpValid = await otpService.verifyAndDeleteOTP('password_reset', email, otp);
      } catch (error) {
        logger.error('Failed to verify OTP from Redis, falling back to database', {
          error: error.message,
          userId: user._id
        });
        // Fallback to database verification
        if (user.resetPasswordOtp && user.resetPasswordOtp === otp.toUpperCase()) {
          if (user.resetPasswordExpire && user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({
              success: false, error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới'
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
            success: false, error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới'
          });
        }
        otpValid = true;
      }
    }

    if (!otpValid) {
      return res.status(400).json({ success: false, error: 'Mã OTP không chính xác' });
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
    success: true, token
  });
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {

        const { idToken } = req.body;

        if ( !idToken ) {

            return res.status( 400 ).json( { success: false, error: 'Google ID token là bắt buộc' } );

        }

        try {

            const result = await googleAuthService.processGoogleAuth( idToken );
            logger.info( `Google OAuth successful: ${
                result.user.email
            }`, {
                userId: result.user.id,
                isNew: result.isNew
            } );
            res.status( 200 ).json( result );
        } catch ( error ) {
            logger.error( 'Google OAuth failed', { error: error.message } );
            res.status( 400 ).json( {
                success: false,
                error: error.message || 'Xác thực Google thất bại'

            } );

        }

    } ) 
    

    // @desc    Verify email with OTP
    // @route   POST /api/auth/verify-email
    // @access  Public
    const verifyEmail = asyncHandler(async ( req, res ) => {

        const { email, otp } = req.body;

        if ( !email || !otp ) {

            return res.status( 400 ).json( { success: false, error: 'Email và mã OTP là bắt buộc' } );

        }

        // Find user by email
        const user = await User.findOne( { email } );

        if ( ! user ) {

            return res.status( 404 ).json( { success: false, error: 'Không tìm thấy tài khoản với email này' } );

        }

        if ( user.isEmailVerified ) {

            return res.status( 400 ).json( { success: false, error: 'Email đã được xác thực trước đó' } );

        }

        // Verify OTP from Redis or database
        let otpValid = false;
        
        if (otpService) {
          try {
            otpValid = await otpService.verifyAndDeleteOTP('email_verification', email, otp);
          } catch (error) {
            logger.error('Failed to verify OTP from Redis, falling back to database', {
              error: error.message,
              userId: user._id
            });
            // Fallback to database verification
            const expectedOtp = user.emailVerificationOtp;
            if (expectedOtp && expectedOtp === otp.toUpperCase()) {
              if (user.emailVerificationExpire && user.emailVerificationExpire < Date.now()) {
                return res.status(400).json({
                  success: false, error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới'
                });
              }
              otpValid = true;
            }
          }
        } else {
          // Fallback to database verification
          const expectedOtp = user.emailVerificationOtp;
          if (expectedOtp && expectedOtp === otp.toUpperCase()) {
            if (user.emailVerificationExpire && user.emailVerificationExpire < Date.now()) {
              return res.status(400).json({
                success: false, error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới'
              });
            }
            otpValid = true;
          }
        }
        if (!otpValid) {
          logger.error('OTP verification failed', {
            userId: user._id,
            email: user.email,
            providedOtp: otp.toUpperCase()
          });
          return res.status(400).json({ success: false, error: 'Mã OTP không chính xác' });
        }

  // Set email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationOtp = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  // Create new token after email verification
  const token = user.getSignedJwtToken();

  logger.info(`Email verified with OTP for user: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true, 
    token,
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
// @access  Public
const resendEmailVerification = asyncHandler(async (req, res) => {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Email là bắt buộc' 
                });
            }
            
            const user = await User.findOne({ email });
            if ( ! user ) {
                return res.status( 404 ).json( { success: false, error: 'Không tìm thấy tài khoản với email này' } );
            }
            if ( user.isEmailVerified ) {
                return res.status( 400 ).json( { success: false, error: 'Email đã được xác thực' } );
            }
            // Check cooldown for resend verification
            if (otpCooldownService) {
              const inCooldown = await otpCooldownService.isInCooldown('resend_verification', user.email);
              if (inCooldown) {
                const remainingTime = await otpCooldownService.getRemainingCooldown('resend_verification', user.email);
                return res.status(429).json({
                  success: false,
                  error: `Vui lòng đợi ${Math.ceil(remainingTime)} giây trước khi gửi lại OTP.`,
                  retryAfter: remainingTime
                });
              }
            }

            // Generate new verification token and OTP
            const verificationToken = crypto.randomBytes( 20 ).toString( 'hex' );
            const verificationOtp = verificationToken.substring( 0, 6 ).toUpperCase();

            // Store OTP in Redis if available, otherwise fallback to database
            if (otpService) {
              try {
                await otpService.storeOTP('email_verification', user.email, verificationOtp);
                // Only store hashed token in database for security
                user.emailVerificationToken = crypto.createHash( 'sha256' ).update( verificationToken ).digest( 'hex' );
                user.emailVerificationOtp = undefined; // Clear OTP from database
                user.emailVerificationExpire = undefined; // Clear expiry from database
              } catch (error) {
                logger.error('Failed to store OTP in Redis, falling back to database', {
                  error: error.message,
                  userId: user._id
                });
                // Fallback to database storage
                user.emailVerificationToken = crypto.createHash( 'sha256' ).update( verificationToken ).digest( 'hex' );
                user.emailVerificationOtp = verificationOtp;
                user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
              }
            } else {
              // Fallback to database storage
              user.emailVerificationToken = crypto.createHash( 'sha256' ).update( verificationToken ).digest( 'hex' );
              user.emailVerificationOtp = verificationOtp;
              user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
            }
            
            await user.save( { validateBeforeSave: false } );
            // Send verification email
            try {
                await sendEmailVerification( user, verificationToken );
                logger.info( `Email verification resent to: ${
                    user.email
                }`, { userId: user._id } );

                // Set cooldown after successful email send
                if (otpCooldownService) {
                  await otpCooldownService.setCooldown('resend_verification', user.email);
                }
                res.status( 200 ).json( { success: true, message: 'Email xác thực đã được gửi thành công' } );
            } catch ( error ) {
                logger.error( 'Failed to resend verification email', {
                    error: error.message,
                    userId: user._id

                } );

                res.status( 500 ).json( { success: false, error: 'Không thể gửi email xác thực' } );
            }

        } ) 
        

        module.exports = {

            register,
            login,
            logout,
            forgotPassword,
            resetPassword,
            googleAuth,
            verifyEmail,
            resendEmailVerification,
            initializeOTPService

        };
