/**
 * Credential Entity
 * Domain: Identity
 * Manages user authentication credentials
 */
class Credential {
  constructor(props) {
    // Protected properties (entity properties)
    this._userId = props.userId;
    this._password = props.password;
    this._refreshToken = props.refreshToken || null;
    this._passwordResetToken = props.passwordResetToken || null;
    this._resetTokenExpiresAt = props.resetTokenExpiresAt || null;
    this._lastPasswordChangeAt = props.lastPasswordChangeAt || new Date();

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._userId) {
      throw new Error('User ID is required');
    }
    if (!this._password) {
      throw new Error('Password is required');
    }
  }

  // Getters for protected properties
  get userId() {
    return this._userId;
  }
  get password() {
    return this._password;
  }
  get refreshToken() {
    return this._refreshToken;
  }
  get passwordResetToken() {
    return this._passwordResetToken;
  }
  get resetTokenExpiresAt() {
    return this._resetTokenExpiresAt;
  }
  get lastPasswordChangeAt() {
    return this._lastPasswordChangeAt;
  }

  // Getters for private properties
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  /**
   * Validate password against stored hash
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>}
   */
  async validatePassword(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this._password);
  }

  /**
   * Change password hash
   * @param {string} newHash - New password hash
   */
  changePassword(newHash) {
    this._password = newHash;
    this._lastPasswordChangeAt = new Date();
    this._passwordResetToken = null;
    this._resetTokenExpiresAt = null;
    this._updatedAt = new Date();
  }

  /**
   * Generate password reset token
   * @returns {string}
   */
  generatePasswordResetToken() {
    const crypto = require('crypto');
    this._passwordResetToken = crypto.randomBytes(32).toString('hex');
    this._resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    this._updatedAt = new Date();
    return this._passwordResetToken;
  }

  /**
   * Check if reset token is valid
   * @returns {boolean}
   */
  isResetTokenValid() {
    return (
      this._passwordResetToken &&
      this._resetTokenExpiresAt &&
      this._resetTokenExpiresAt > new Date()
    );
  }

  /**
   * Revoke refresh token
   */
  revokeRefreshToken() {
    this._refreshToken = null;
    this._updatedAt = new Date();
  }

  /**
   * Set refresh token
   * @param {string} token
   */
  setRefreshToken(token) {
    this._refreshToken = token;
    this._updatedAt = new Date();
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      userId: this._userId,
      password: this._password,
      refreshToken: this._refreshToken,
      passwordResetToken: this._passwordResetToken,
      resetTokenExpiresAt: this._resetTokenExpiresAt,
      lastPasswordChangeAt: this._lastPasswordChangeAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = Credential;
