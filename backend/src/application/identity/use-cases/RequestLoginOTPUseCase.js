const User = require('../../../infrastructure/models/User');
const EmailService = require('../../../infrastructure/services/external/core/EmailService');
const { logger } = require('../../../shared/utils/logger');
const { generateAndStoreOTP } = require('../../../shared/utils/otpHelpers');

class RequestLoginOTPUseCase {
  constructor(otpService, otpCooldownService) {
    this.otpService = otpService;
    this.otpCooldownService = otpCooldownService;
  }

  async execute({ email }) {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Request login OTP attempt with unregistered email', {
        email,
      });
      throw new Error('USER_NOT_FOUND');
    }

    // Check cooldown
    if (this.otpCooldownService) {
      const inCooldown = await this.otpCooldownService.isInCooldown(
        'login',
        email
      );
      if (inCooldown) {
        const remainingTime =
          await this.otpCooldownService.getRemainingCooldown('login', email);
        throw new Error(`COOLDOWN_ACTIVE:${remainingTime}`);
      }
    }

    // Generate OTP
    const loginOtp = await generateAndStoreOTP(
      this.otpService,
      'login',
      email,
      user,
      'loginToken', // assuming field name
      'loginOtp',
      'loginOtpExpire',
      5 * 60 * 1000 // 5 minutes
    );

    // Send OTP email
    await EmailService.sendLoginOTPEmail(user, loginOtp);

    if (this.otpCooldownService) {
      await this.otpCooldownService.setCooldown('login', email);
    }

    return {
      message: 'OTP sent successfully',
    };
  }
}

module.exports = RequestLoginOTPUseCase;
