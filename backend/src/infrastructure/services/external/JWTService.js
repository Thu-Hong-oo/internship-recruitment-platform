const jwt = require('jsonwebtoken');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  generateAccessToken(payload) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'smart-recruitment-platform',
      audience: 'smart-recruitment-users',
    });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ id: userId, userId, type: 'refresh' }, this.refreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'smart-recruitment-platform',
      audience: 'smart-recruitment-users',
    });
  }

  generateTokens(user) {
    const payload = {
      id: user._id,
      userId: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(user._id),
      expiresIn: this.accessTokenExpiry,
    };
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'smart-recruitment-platform',
        audience: 'smart-recruitment-users',
      });
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'smart-recruitment-platform',
        audience: 'smart-recruitment-users',
      });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  verifyToken(token, isRefresh = false) {
    return isRefresh
      ? this.verifyRefreshToken(token)
      : this.verifyAccessToken(token);
  }

  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Token decode failed: ${error.message}`);
    }
  }

  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  }

  getTokenExpiry(token) {
    try {
      const decoded = this.decodeToken(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  generatePasswordResetToken(userId) {
    return jwt.sign({ id: userId, userId, type: 'password-reset' }, this.secret, {
      expiresIn: '1h',
      issuer: 'smart-recruitment-platform',
    });
  }

  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'smart-recruitment-platform',
      });

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Invalid password reset token: ${error.message}`);
    }
  }

  generateEmailVerificationToken(userId) {
    return jwt.sign({ id: userId, userId, type: 'email-verification' }, this.secret, {
      expiresIn: '24h',
      issuer: 'smart-recruitment-platform',
    });
  }

  verifyEmailVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'smart-recruitment-platform',
      });

      if (decoded.type !== 'email-verification') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Invalid email verification token: ${error.message}`);
    }
  }

  generateApiToken(userId, permissions = []) {
    return jwt.sign({ id: userId, userId, permissions, type: 'api' }, this.secret, {
      expiresIn: '30d',
      issuer: 'smart-recruitment-platform',
    });
  }

  verifyApiToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'smart-recruitment-platform',
      });

      if (decoded.type !== 'api') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Invalid API token: ${error.message}`);
    }
  }

  generateInviteToken(email, role, companyId = null) {
    const payload = { email, role, type: 'invite' };
    if (companyId) payload.companyId = companyId;

    return jwt.sign(payload, this.secret, {
      expiresIn: '7d',
      issuer: 'smart-recruitment-platform',
    });
  }

  verifyInviteToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'smart-recruitment-platform',
      });

      if (decoded.type !== 'invite') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Invalid invite token: ${error.message}`);
    }
  }

  blacklistToken(token) {
    // In a production environment, you would store this in Redis or a database
    // For now, we'll just return true
    return true;
  }

  isTokenBlacklisted(token) {
    // In a production environment, you would check Redis or database
    // For now, we'll just return false
    return false;
  }

  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }

  generateSessionToken(userId, sessionData = {}) {
    return jwt.sign({ userId, sessionData, type: 'session' }, this.secret, {
      expiresIn: '24h',
      issuer: 'smart-recruitment-platform',
    });
  }

  verifySessionToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'smart-recruitment-platform',
      });

      if (decoded.type !== 'session') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Invalid session token: ${error.message}`);
    }
  }

  getTokenInfo(token) {
    try {
      const decoded = this.decodeToken(token);
      return {
        id: decoded.id || decoded.userId,
        userId: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        status: decoded.status,
        type: decoded.type,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
        isExpired: decoded.exp < Date.now() / 1000,
      };
    } catch (error) {
      throw new Error(`Token info extraction failed: ${error.message}`);
    }
  }
}

module.exports = new JWTService();
