const User = require('../../../infrastructure/models/User');
const bcrypt = require('bcryptjs');
const { logger } = require('../../../shared/utils/logger');
const { verifyOTP } = require('../../../shared/utils/otpHelpers');

class ResetPasswordUseCase {
  constructor(otpService) {
    this.otpService = otpService;
  }

  async execute({ email, otp, password }) {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Reset password attempt with unregistered email', { email });
      throw new Error('USER_NOT_FOUND');
    }

    // Verify OTP
    let otpValid = false;
    try {
      otpValid = await verifyOTP(
        this.otpService,
        'password_reset',
        email,
        otp,
        user,
        'resetPasswordOtp',
        'resetPasswordExpire'
      );
    } catch (error) {
      if (error.message === 'OTP_EXPIRED') {
        throw new Error('OTP_EXPIRED');
      }
    }

    if (!otpValid) {
      logger.warn('Reset password attempt with invalid OTP', { email });
      throw new Error('INVALID_OTP');
    }

    // Set new password (hash it)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info(`Password reset completed for: ${user.email}`, {
      userId: user._id,
    });

    return {
      message: 'Password reset successfully',
      requireLogin: true,
    };
  }
}

module.exports = ResetPasswordUseCase;
