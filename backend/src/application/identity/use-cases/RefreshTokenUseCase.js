const User = require('../../../infrastructure/models/User');
const jwt = require('jsonwebtoken');
const { logger } = require('../../../shared/utils/logger');

class RefreshTokenUseCase {
  async execute({ refreshToken }) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('INVALID_TOKEN');
    }

    // Generate new tokens
    const newAccessToken = user.getSignedJwtToken();
    const newRefreshToken = user.getSignedRefreshToken();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

module.exports = RefreshTokenUseCase;
