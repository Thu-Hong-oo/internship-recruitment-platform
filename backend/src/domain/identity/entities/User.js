const UserStatus = require('../enums/UserStatus');
const AuthProvider = require('../enums/AuthProvider');

/**
 * User Entity (Abstract)
 * Domain: Identity
 * Base class for all user types in the system
 */
class User {
  constructor(props) {
    if (new.target === User) {
      throw new Error(
        'User is an abstract class and cannot be instantiated directly'
      );
    }

    // Protected properties (entity properties)
    this._userId = props.userId;
    this._fullName = props.fullName;
    this._email = props.email;
    this._avatarUrl = props.avatarUrl || null;
    this._status = props.status || UserStatus.PENDING_VERIFICATION;
    this._provider = props.provider || AuthProvider.EMAIL;

    // Private properties (database-generated)
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._email) {
      throw new Error('Email is required');
    }
    if (!this._fullName) {
      throw new Error('Full name is required');
    }
    if (!Object.values(UserStatus).includes(this._status)) {
      throw new Error('Invalid user status');
    }
    if (!Object.values(AuthProvider).includes(this._provider)) {
      throw new Error('Invalid auth provider');
    }
  }

  // Getters for protected properties
  get userId() {
    return this._userId;
  }
  get fullName() {
    return this._fullName;
  }
  get email() {
    return this._email;
  }
  get avatarUrl() {
    return this._avatarUrl;
  }
  get status() {
    return this._status;
  }
  get provider() {
    return this._provider;
  }

  // Getters for private properties
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  /**
   * Update user profile information
   * @param {string} fullName - New full name
   * @param {string} avatarUrl - New avatar URL
   */
  updateProfile(fullName, avatarUrl) {
    if (fullName && fullName.trim()) {
      this._fullName = fullName.trim();
    }
    if (avatarUrl !== undefined) {
      this._avatarUrl = avatarUrl;
    }
    this._updatedAt = new Date();
  }

  /**
   * Suspend the user account
   */
  suspend() {
    this._status = UserStatus.SUSPENDED;
    this._updatedAt = new Date();
  }

  /**
   * Reactivate the user account
   */
  reactivate() {
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * Check if user account is active
   * @returns {boolean}
   */
  isActive() {
    return this._status === UserStatus.ACTIVE;
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      userId: this._userId,
      fullName: this._fullName,
      email: this._email,
      avatarUrl: this._avatarUrl,
      status: this._status,
      provider: this._provider,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

module.exports = User;
