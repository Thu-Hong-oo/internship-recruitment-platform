const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

/**
 * Authentication Configuration Module
 * Handles JWT tokens, password hashing, and auth-related utilities
 */
class AuthConfig {
  constructor() {
    this.jwtSecret = config.auth.jwtSecret;
    this.jwtRefreshSecret = config.auth.jwtRefreshSecret;
    this.jwtExpire = config.auth.jwtExpire;
    this.bcryptRounds = config.auth.bcryptRounds;
  }

  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.email - User email
   * @param {string} payload.role - User role
   * @returns {string} JWT token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpire,
        issuer: 'internship-platform',
        audience: 'api-users',
      });
    } catch (error) {
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  /**
   * Generate JWT refresh token
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @returns {string} Refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, this.jwtRefreshSecret, {
        expiresIn: '30d', // Refresh tokens last longer
        issuer: 'internship-platform',
        audience: 'api-refresh',
      });
    } catch (error) {
      throw new Error(`Failed to generate refresh token: ${error.message}`);
    }
  }

  /**
   * Verify JWT access token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'internship-platform',
        audience: 'api-users',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      } else {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Verify JWT refresh token
   * @param {string} token - Refresh token to verify
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'internship-platform',
        audience: 'api-refresh',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error(`Refresh token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const salt = await bcrypt.genSalt(this.bcryptRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Failed to hash password: ${error.message}`);
    }
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} True if passwords match
   */
  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(`Failed to compare password: ${error.message}`);
    }
  }

  /**
   * Generate secure random token for email verification, password reset, etc.
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} Hex token
   */
  generateSecureToken(length = 32) {
    return require('crypto').randomBytes(length).toString('hex');
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with isValid and errors array
   */
  validatePasswordStrength(password) {
    const rules = config.validation.password;
    const errors = [];

    if (password.length < rules.minLength) {
      errors.push(
        `Password must be at least ${rules.minLength} characters long`
      );
    }

    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (rules.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (rules.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (
      rules.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if email is valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      emailRegex.test(email) &&
      email.length <= config.validation.email.maxLength
    );
  }

  /**
   * Get token expiration info
   * @param {string} token - JWT token
   * @returns {Object} Expiration info
   */
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token');
      }

      const expirationDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const timeLeft = expirationDate - now;

      return {
        expiresAt: expirationDate,
        timeLeftMs: timeLeft,
        timeLeftMinutes: Math.floor(timeLeft / (1000 * 60)),
        isExpired: timeLeft <= 0,
      };
    } catch (error) {
      throw new Error(`Failed to get token expiration: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Object} New access and refresh tokens
   */
  async refreshTokens(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Generate new tokens
      const userId = decoded.id || decoded.userId;
      const payload = {
        id: userId,
        userId: userId,
        email: decoded.email,
        role: decoded.role,
      };

      const newAccessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken({
        id: userId,
        userId: userId,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.jwtExpire,
      };
    } catch (error) {
      throw new Error(`Failed to refresh tokens: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new AuthConfig();
