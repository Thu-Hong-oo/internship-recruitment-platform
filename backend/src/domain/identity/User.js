// src/domain/identity/User.js
const UserRole = require('./UserRole');
const UserStatus = require('./UserStatus');
const OAuthCredential = require('./entities/OAuthCredential');
const OAuthProvider = require('./enums/OAuthProvider');

class User {
  constructor(
    userId,
    email,
    fullName,
    avatarUrl = null,
    password,
    role = UserRole.CANDIDATE,
    status = UserStatus.ACTIVE,
    lastLogin = null,
    oauthCredentials = []
  ) {
    this.userId = userId;
    this.email = email;
    this.fullName = fullName;
    this.avatarUrl = avatarUrl;
    this.password = password;
    this.role = role;
    this.status = status;
    this.lastLogin = lastLogin;
    this.oauthCredentials = oauthCredentials; // List<OAuthCredential>
  }

  changeEmail(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email format');
    }
    this.email = email;
  }

  updateProfile(name) {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.fullName = name;
  }

  isActive() {
    return this.status === UserStatus.ACTIVE;
  }

  validatePassword(password) {
    // Simple validation - in real app, use bcrypt
    return password && password.length >= 6;
  }

  changePassword(newHash) {
    if (!newHash) {
      throw new Error('Password hash cannot be empty');
    }
    this.password = newHash;
  }

  refreshOAuthToken(provider) {
    const credential = this.oauthCredentials.find(c => c.provider === provider);
    if (credential) {
      credential.refreshToken();
    }
  }

  isOAuthExpired(provider) {
    const credential = this.oauthCredentials.find(c => c.provider === provider);
    return credential ? credential.isExpired() : true;
  }

  // Business logic methods
  canAccessEmployerFeatures() {
    return this.role === UserRole.EMPLOYER || this.role === UserRole.ADMIN;
  }

  canAccessAdminFeatures() {
    return this.role === UserRole.ADMIN;
  }

  hasCandidateProfile() {
    return this.role === UserRole.CANDIDATE && this.candidate !== null;
  }

  getCandidateProfile() {
    if (!this.hasCandidateProfile()) {
      throw new Error('User does not have a candidate profile');
    }
    return this.candidate;
  }

  setCandidateProfile(candidate) {
    if (this.role !== UserRole.CANDIDATE) {
      throw new Error('Only CANDIDATE users can have candidate profiles');
    }
    this.candidate = candidate;
  }
}

module.exports = User;
