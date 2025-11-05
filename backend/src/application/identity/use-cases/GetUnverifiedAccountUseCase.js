const User = require('../../../infrastructure/models/User');
const { logger } = require('../../../shared/utils/logger');

class GetUnverifiedAccountUseCase {
  async execute({ email }) {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return {
        email: email,
        status: 'not_found',
        message: 'Account not registered',
      };
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return {
        email: user.email,
        fullName: user.displayFullName,
        status: 'verified',
        message: 'Account already verified',
        verifiedAt: user.updatedAt,
      };
    }

    // Check if verification has expired
    const now = new Date();
    const verificationExpiry = new Date(
      user.createdAt.getTime() + 24 * 60 * 60 * 1000
    ); // 24 hours

    if (now > verificationExpiry) {
      return {
        email: user.email,
        fullName: user.displayFullName,
        status: 'expired',
        message: 'Verification code has expired. Please register again.',
        createdAt: user.createdAt,
        verificationExpiry: verificationExpiry,
      };
    }

    // Return unverified account info
    return {
      email: user.email,
      fullName: user.displayFullName,
      status: 'pending',
      message: 'Account not verified',
      createdAt: user.createdAt,
      verificationExpiry: verificationExpiry,
      timeRemaining: Math.max(0, verificationExpiry.getTime() - now.getTime()),
    };
  }
}

module.exports = GetUnverifiedAccountUseCase;
