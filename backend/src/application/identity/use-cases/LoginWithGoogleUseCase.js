const googleAuthService = require('../../../infrastructure/services/external/core/GoogleAuthService');
const { logger } = require('../../../shared/utils/logger');

class LoginWithGoogleUseCase {
  async execute({ idToken }) {
    const result = await googleAuthService.processGoogleAuth(idToken);
    logger.info(`Google OAuth successful: ${result.user.email}`, {
      userId: result.user.id,
      isNew: result.isNew,
    });
    return result;
  }
}

module.exports = LoginWithGoogleUseCase;
