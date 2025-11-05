const User = require('../../../infrastructure/models/User');
const EmailService = require('../../../infrastructure/services/external/core/EmailService');
const crypto = require('crypto');
const { logger } = require('../../../shared/utils/logger');

class ResendEmailVerificationUseCase {
  constructor(otpService, otpCooldownService) {
    this.otpService = otpService;
    this.otpCooldownService = otpCooldownService;
  }

  async execute({ email }) {
    const user = await User.findOne({ email });

    // Case A: User exists in DB
    if (user) {
      if (user.isEmailVerified) {
        throw new Error('EMAIL_ALREADY_VERIFIED');
      }
      // proceed to generate OTP for existing unverified user
    }

    // Case B: User is pending in Redis (pre-registration)
    let pendingRegistration = null;
    if (!user && this.otpService) {
      try {
        const pending = await this.otpService.get(`user_registration:${email}`);
        if (pending) pendingRegistration = JSON.parse(pending);
      } catch (e) {
        // ignore parse errors
      }
    }

    if (!user && !pendingRegistration) {
      logger.warn('Resend verification attempt with unregistered email', {
        email,
      });
      throw new Error('USER_NOT_FOUND');
    }

    // Check cooldown for resend verification
    if (this.otpCooldownService) {
      const inCooldown = await this.otpCooldownService.isInCooldown(
        'resend_verification',
        email
      );
      if (inCooldown) {
        const remainingTime =
          await this.otpCooldownService.getRemainingCooldown(
            'resend_verification',
            email
          );
        throw new Error(`COOLDOWN_ACTIVE:${remainingTime}`);
      }
    }

    // Generate new verification token and OTP
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationOtp = verificationToken.substring(0, 6).toUpperCase();

    // Store OTP
    const targetEmail = user
      ? user.email
      : pendingRegistration
      ? pendingRegistration.email
      : email;

    if (this.otpService) {
      try {
        await this.otpService.storeOTP(
          'email_verification',
          targetEmail,
          verificationOtp
        );
        if (user) {
          user.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
          user.emailVerificationOtp = undefined;
          user.emailVerificationExpire = undefined;
        } else if (pendingRegistration) {
          const updatedPending = {
            ...pendingRegistration,
            verificationToken: crypto
              .createHash('sha256')
              .update(verificationToken)
              .digest('hex'),
          };
          await this.otpService.setWithExpiry(
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
    if (user) {
      await EmailService.sendVerificationEmail(user, verificationOtp);
    } else if (pendingRegistration) {
      await EmailService.sendVerificationEmail(
        {
          email: email,
          fullName: pendingRegistration.fullName || email.split('@')[0],
        },
        verificationOtp
      );
    }

    logger.info('Email verification resent', {
      email,
      userId: user ? user._id : undefined,
      context: user ? 'db_user' : 'redis_pending',
    });

    // Set cooldown after successful email send
    if (this.otpCooldownService) {
      await this.otpCooldownService.setCooldown('resend_verification', email);
    }

    return {
      message: 'Verification email sent successfully',
      emailSent: true,
    };
  }
}

module.exports = ResendEmailVerificationUseCase;
