const User = require('../../../infrastructure/models/User');
const { logger } = require('../../../shared/utils/logger');

/**
 * UseCase for user login
 * Handles business logic for authenticating users
 */
class LoginUserUseCase {
  async execute({ email, password }) {
    // Check for user
    const user = await User.findOne({ email }).select(
      '+password +fullName +avatar +googleProfile +preferences +lastLogin +candidateProfile +employerProfile'
    );
    if (!user) {
      throw new Error('EMAIL_NOT_REGISTERED');
    }

    // Check if user can use password authentication
    if (!user.canUsePassword()) {
      throw new Error('GOOGLE_OAUTH_REQUIRED');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('INVALID_PASSWORD');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('ACCOUNT_DISABLED');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Create token
    const token = user.getSignedJwtToken();

    logger.info(`User logged in with local auth: ${user.email}`, {
      userId: user._id,
    });

    return { token, user };
  }
}

module.exports = LoginUserUseCase;
