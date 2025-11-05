const UserRole = require('./enums/UserRole');
const UserStatus = require('./enums/UserStatus');
const AuthProvider = require('./enums/AuthProvider');

/**
 * User Domain Entity
 *
 * Represents a user in the system (candidate, employer, or admin).
 * Contains authentication, profile, and authorization information.
 *
 * Following Clean Architecture principles:
 * - No dependencies on infrastructure layer
 * - Business logic encapsulated within entity
 * - Constructor accepts only required fields
 * - Optional fields set to null (not undefined)
 * - No default values in constructor
 */
class User {
  constructor(
    userId,
    email,
    fullName,
    role,
    status = UserStatus.PENDING_VERIFICATION,
    provider = AuthProvider.EMAIL,
    password = null,
    avatarUrl = null,
    isEmailVerified = false,
    googleProfile = null,
    preferences = null,
    lastLogin = null,
    candidateProfileId = null,
    employerProfileId = null,
    createdAt = null,
    updatedAt = null
  ) {
    // Required fields
    this.userId = userId;
    this.email = email;
    this.fullName = fullName;
    this.role = role;

    // Auth fields
    this.status = status;
    this.provider = provider;
    this.password = password;
    this.isEmailVerified = isEmailVerified;

    // Optional fields
    this.avatarUrl = avatarUrl;
    this.googleProfile = googleProfile; // { googleId, profilePicture }
    this.preferences = preferences;
    this.lastLogin = lastLogin;

    // Profile references
    this.candidateProfileId = candidateProfileId;
    this.employerProfileId = employerProfileId;

    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validates the user entity
   * @throws {Error} if validation fails
   */
  validate() {
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!this.role) {
      throw new Error('User role is required');
    }

    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(this.role)) {
      throw new Error(`Invalid role: ${this.role}`);
    }

    const validStatuses = Object.values(UserStatus);
    if (!validStatuses.includes(this.status)) {
      throw new Error(`Invalid status: ${this.status}`);
    }

    const validProviders = Object.values(AuthProvider);
    if (!validProviders.includes(this.provider)) {
      throw new Error(`Invalid provider: ${this.provider}`);
    }
  }

  /**
   * Changes user email
   * @param {string} email - New email address
   */
  changeEmail(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email format');
    }
    this.email = email;
    this.isEmailVerified = false; // Require re-verification
    this.updatedAt = new Date();
  }

  /**
   * Updates user profile information
   * @param {string} fullName - New full name
   * @param {string} avatarUrl - New avatar URL
   */
  updateProfile(fullName, avatarUrl = null) {
    if (fullName && fullName.trim().length > 0) {
      this.fullName = fullName;
    }
    if (avatarUrl !== null) {
      this.avatarUrl = avatarUrl;
    }
    this.updatedAt = new Date();
  }

  /**
   * Updates user password (hashed)
   * @param {string} hashedPassword - New hashed password
   */
  changePassword(hashedPassword) {
    if (!hashedPassword) {
      throw new Error('Password hash cannot be empty');
    }
    if (this.provider !== AuthProvider.EMAIL) {
      throw new Error('Cannot change password for OAuth users');
    }
    this.password = hashedPassword;
    this.updatedAt = new Date();
  }

  /**
   * Verifies user email
   */
  verifyEmail() {
    this.isEmailVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * Activates user account
   */
  activate() {
    this.status = UserStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Suspends user account
   */
  suspend() {
    this.status = UserStatus.SUSPENDED;
    this.updatedAt = new Date();
  }

  /**
   * Deactivates user account
   */
  deactivate() {
    this.status = UserStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Records user login
   */
  recordLogin() {
    this.lastLogin = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Updates user preferences
   * @param {Object} preferences - User preferences
   */
  updatePreferences(preferences) {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };
    this.updatedAt = new Date();
  }

  /**
   * Checks if user is active
   * @returns {boolean} True if user is active
   */
  isActive() {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Checks if user is suspended
   * @returns {boolean} True if user is suspended
   */
  isSuspended() {
    return this.status === UserStatus.SUSPENDED;
  }

  /**
   * Checks if user is pending verification
   * @returns {boolean} True if user is pending verification
   */
  isPendingVerification() {
    return this.status === UserStatus.PENDING_VERIFICATION;
  }

  /**
   * Checks if user can use password authentication
   * @returns {boolean} True if user uses email/password
   */
  canUsePassword() {
    return this.provider === AuthProvider.EMAIL;
  }

  /**
   * Checks if user uses Google OAuth
   * @returns {boolean} True if user uses Google
   */
  isGoogleUser() {
    return this.provider === AuthProvider.GOOGLE;
  }

  /**
   * Checks if user is a candidate
   * @returns {boolean} True if user is a candidate
   */
  isCandidate() {
    return this.role === UserRole.CANDIDATE;
  }

  /**
   * Checks if user is an employer
   * @returns {boolean} True if user is an employer
   */
  isEmployer() {
    return this.role === UserRole.EMPLOYER;
  }

  /**
   * Checks if user is an admin
   * @returns {boolean} True if user is an admin
   */
  isAdmin() {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Checks if user can access employer features
   * @returns {boolean} True if user is employer or admin
   */
  canAccessEmployerFeatures() {
    return this.isEmployer() || this.isAdmin();
  }

  /**
   * Checks if user can access admin features
   * @returns {boolean} True if user is admin
   */
  canAccessAdminFeatures() {
    return this.isAdmin();
  }

  /**
   * Checks if user has candidate profile
   * @returns {boolean} True if user has candidate profile
   */
  hasCandidateProfile() {
    return this.candidateProfileId !== null;
  }

  /**
   * Checks if user has employer profile
   * @returns {boolean} True if user has employer profile
   */
  hasEmployerProfile() {
    return this.employerProfileId !== null;
  }

  /**
   * Gets display name for user
   * @returns {string} Display name
   */
  getDisplayName() {
    if (this.fullName && this.fullName.trim().length > 0) {
      return this.fullName;
    }
    return this.email.split('@')[0];
  }
}

module.exports = User;
