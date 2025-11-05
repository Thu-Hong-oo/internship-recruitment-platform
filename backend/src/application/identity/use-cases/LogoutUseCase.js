const { logger } = require('../../../shared/utils/logger');

class LogoutUseCase {
  async execute({ user }) {
    logger.info(`User logged out: ${user.email}`, { userId: user._id });

    // TODO: Add token to blacklist if using Redis
    // await addToBlacklist(token);

    return {
      message: 'Logged out successfully',
    };
  }
}

module.exports = LogoutUseCase;
