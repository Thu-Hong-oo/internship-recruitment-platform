// src/domain/identity/entities/OAuthCredential.js
const OAuthProvider = require('../enums/OAuthProvider');

class OAuthCredential {
  constructor(
    provider,
    providerUserId,
    accessToken,
    refreshToken = null,
    expiresAt = null
  ) {
    this.provider = provider;
    this.providerUserId = providerUserId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
  }

  refreshToken() {
    // Logic to refresh token - in real implementation, call OAuth provider API
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    // Simulate token refresh
    this.accessToken = 'new_access_token';
    this.expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
  }

  isExpired() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }
}

module.exports = OAuthCredential;
