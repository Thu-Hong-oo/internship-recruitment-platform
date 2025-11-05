const User = require('../../../infrastructure/models/User');
const { logger } = require('../../../shared/utils/logger');
const { verifyOTP } = require('../../../shared/utils/otpHelpers');

class VerifyLoginOTPUseCase {
  constructor(otpService) {
    this.otpService = otpService;
  }

  async execute({ email, otp }) {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Verify login OTP attempt with unregistered email', {
        email,
      });
      throw new Error('USER_NOT_FOUND');
    }

    // Verify OTP
    let otpValid = false;
    try {
      otpValid = await verifyOTP(
        this.otpService,
        'login',
        email,
        otp,
        user,
        'loginOtp',
        'loginOtpExpire'
      );
    } catch (error) {
      if (error.message === 'OTP_EXPIRED') {
        throw new Error('OTP_EXPIRED');
      }
    }

    if (!otpValid) {
      logger.warn('Verify login OTP attempt with invalid OTP', { email });
      throw new Error('INVALID_OTP');
    }

    // Clear OTP data
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.getSignedJwtToken();

    logger.info(`User logged in with OTP: ${user.email}`, { userId: user._id });

    return {
      token,
      user,
    };
  }
}

module.exports = VerifyLoginOTPUseCase;
