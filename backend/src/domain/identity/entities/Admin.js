const User = require('./User');

/**
 * Admin Entity
 * Domain: Identity
 * Represents a system administrator with elevated permissions
 */
class Admin extends User {
  constructor(props) {
    super(props);

    // Protected properties (entity properties)
    this._permissions = props.permissions || ['read']; // Default read permission

    this.validateAdmin();
  }

  validateAdmin() {
    super.validate();

    if (!Array.isArray(this._permissions)) {
      throw new Error('Permissions must be an array');
    }

    const validPermissions = [
      'read',
      'write',
      'delete',
      'manage_users',
      'manage_system',
    ];
    const invalidPermissions = this._permissions.filter(
      perm => !validPermissions.includes(perm)
    );
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }
  }

  // Getters for protected properties
  get permissions() {
    return [...this._permissions];
  } // Return copy to prevent mutation

  /**
   * Update admin profile information
   * @param {Object} profileData - Profile data to update
   */
  updateProfile(profileData) {
    super.updateProfile(profileData.fullName, profileData.avatarUrl);

    if (profileData.permissions !== undefined) {
      this._permissions = profileData.permissions;
      this.validateAdmin();
    }
  }

  /**
   * Add a permission to the admin
   * @param {string} permission - Permission to add
   */
  addPermission(permission) {
    if (!this._permissions.includes(permission)) {
      this._permissions.push(permission);
      this._updatedAt = new Date();
      this.validateAdmin();
    }
  }

  /**
   * Remove a permission from the admin
   * @param {string} permission - Permission to remove
   */
  removePermission(permission) {
    const index = this._permissions.indexOf(permission);
    if (index > -1) {
      this._permissions.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  /**
   * Check if admin has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(permission) {
    return this._permissions.includes(permission);
  }

  /**
   * Check if admin can manage users
   * @returns {boolean}
   */
  canManageUsers() {
    return this.isActive() && this.hasPermission('manage_users');
  }

  /**
   * Check if admin can manage system
   * @returns {boolean}
   */
  canManageSystem() {
    return this.isActive() && this.hasPermission('manage_system');
  }

  /**
   * Check if admin can perform write operations
   * @returns {boolean}
   */
  canWrite() {
    return this.isActive() && this.hasPermission('write');
  }

  /**
   * Check if admin can perform delete operations
   * @returns {boolean}
   */
  canDelete() {
    return this.isActive() && this.hasPermission('delete');
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      permissions: this._permissions,
    };
  }
}

module.exports = Admin;
