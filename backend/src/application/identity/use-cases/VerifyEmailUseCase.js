const User = require('../../../infrastructure/models/User');
const CandidateProfile = require('../../../infrastructure/models/CandidateProfile');
const EmployerProfile = require('../../../infrastructure/models/EmployerProfile');
const Company = require('../../../infrastructure/models/Company');
const UserStatus = require('../../../domain/identity/enums/UserStatus');
const { logger } = require('../../../shared/utils/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * UseCase for email verification
 * Handles business logic for verifying user email with OTP
 */
class VerifyEmailUseCase {
  constructor(otpService) {
    this.otpService = otpService;
  }

  async execute({ email, otp }) {
    // Verify OTP with explicit expired vs mismatch handling
    let otpValid = false;
    try {
      // Debug: inspect otpService
      logger.info('VerifyEmailUseCase otpService type check', {
        hasGetOTP: !!(this.otpService && this.otpService.getOTP),
        hasGet: !!(this.otpService && this.otpService.get),
        serviceType: typeof this.otpService,
      });
      // Check existence first to distinguish expiration
      const existingOtp = await this.otpService.getOTP(
        'email_verification',
        email
      );
      if (!existingOtp) {
        throw new Error('OTP_EXPIRED');
      }

      if (existingOtp !== otp.toUpperCase()) {
        throw new Error('INVALID_OTP');
      }

      // Now consume OTP (delete)
      otpValid = await this.otpService.verifyAndDeleteOTP(
        'email_verification',
        email,
        otp
      );
    } catch (error) {
      if (error.message === 'OTP_EXPIRED' || error.message === 'INVALID_OTP') {
        throw error;
      }
      logger.error('Failed to verify OTP', {
        error: error.message,
        email,
      });
      throw new Error('OTP_VERIFICATION_FAILED');
    }

    if (!otpValid) {
      throw new Error('INVALID_OTP');
    }

    // Get stored user data from Redis
    let userData;
    try {
      const userDataString = await this.otpService.get(
        `user_registration:${email}`
      );
      if (!userDataString) {
        throw new Error('REGISTRATION_EXPIRED');
      }
      userData = JSON.parse(userDataString);
    } catch (error) {
      if (error.message === 'REGISTRATION_EXPIRED') {
        throw error;
      }
      logger.error('Failed to get user data from Redis', {
        error: error.message,
        email,
      });
      throw new Error('REGISTRATION_DATA_ERROR');
    }

    // Create verified user in MongoDB
    try {
      const user = await User.create({
        email: userData.email,
        password: userData.password, // Already hashed
        fullName: userData.fullName,
        role: userData.role,
        provider: 'email',
        isEmailVerified: true,
        status: UserStatus.ACTIVE, // Set status to ACTIVE when email verified
      });

      // Set userId to the MongoDB _id after creation
      user.userId = user._id.toString();
      await user.save();

      // Create user profile based on role
      await this._createUserProfile(user, userData.role);

      // Clean up Redis data
      await this.otpService.delete(`user_registration:${email}`);

      logger.info(
        `New user registered and verified: ${email}, role: ${user.role}`
      );

      return {
        email: user.email,
        isEmailVerified: true,
        role: user.role,
        profileCreated: false, // Profile will be created by controller
      };
    } catch (error) {
      logger.error('Failed to create verified user', {
        error: error.message,
        email,
      });
      throw new Error('USER_CREATION_FAILED');
    }
  }

  /**
   * Create user profile based on role (Candidate only for now)
   * Employer profiles are created on-demand via UpdateEmployerProfileUseCase
   */
  async _createUserProfile(user, role) {
    try {
      if (role === 'candidate') {
        const candidateProfile = await CandidateProfile.create({
          userId: user._id,
          personalInfo: { fullName: user.fullName },
        });
        user.candidateProfile = candidateProfile._id;
        await user.save();
        logger.info(`Candidate profile created for user: ${user._id}`);
      }
      // Note: Employer profiles are NOT auto-created
      // They will be created when user first accesses employer features
      // This allows for proper company setup flow
    } catch (error) {
      logger.error('Failed to create user profile', {
        error: error.message,
        userId: user._id,
        role,
      });
      // Don't throw - profile creation failure shouldn't block verification
    }
  }
}

module.exports = VerifyEmailUseCase;
