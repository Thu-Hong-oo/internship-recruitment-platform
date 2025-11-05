const User = require('../../../infrastructure/models/User');
const EmailService = require('../../../infrastructure/services/external/EmailService');
const { logger } = require('../../../shared/utils/logger');
const { generateAndStoreOTP } = require('../../../shared/utils/otpHelpers');

class ForgotPasswordUseCase {
  constructor(otpService, otpCooldownService) {
    this.otpService = otpService;
    this.otpCooldownService = otpCooldownService;
  }

  async execute({ email }) {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Forgot password attempt with unregistered email', { email });
      throw new Error('USER_NOT_FOUND');
    }

    // Check cooldown for password reset
    if (this.otpCooldownService) {
      const inCooldown = await this.otpCooldownService.isInCooldown(
        'password_reset',
        user.email
      );
      if (inCooldown) {
        const remainingTime =
          await this.otpCooldownService.getRemainingCooldown(
            'password_reset',
            user.email
          );
        throw new Error(`COOLDOWN_ACTIVE:${remainingTime}`);
      }
    }

    // Generate and store OTP
    const resetOtp = await generateAndStoreOTP(
      this.otpService,
      'password_reset',
      user.email,
      user,
      'resetPasswordToken',
      'resetPasswordOtp',
      'resetPasswordExpire',
      10 * 60 * 1000 // 10 minutes
    );

    // Send password reset email
    await EmailService.sendPasswordResetEmail(user, resetOtp);

    logger.info(`Password reset email sent to: ${user.email}`, {
      userId: user._id,
    });

    // Set cooldown after successful email send
    if (this.otpCooldownService) {
      await this.otpCooldownService.setCooldown('password_reset', user.email);
    }

    return {
      email: user.email,
      message: 'Password reset email sent successfully',
      instructions:
        'Please check your email and enter the OTP to reset your password. OTP is valid for 10 minutes.',
      nextStep: 'verify-otp',
      cooldownInfo:
        'If you did not receive the email, you can request again after 5 minutes.',
    };
  }
}

module.exports = ForgotPasswordUseCase;
