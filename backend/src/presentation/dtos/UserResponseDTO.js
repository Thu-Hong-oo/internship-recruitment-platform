/**
 * User Response DTO
 * Presentation Layer - Data Transfer Object for API responses
 * Transforms domain entities into API-friendly format
 */

const { getAvatarUrl } = require('../../shared/utils/avatarUtils');

class UserResponseDTO {
  constructor(userEntity, additionalData = {}) {
    // Transform từ domain entity + infrastructure data
    this.id = userEntity.userId;
    this.email = userEntity.email;
    this.fullName = userEntity.fullName;
    this.role = additionalData.role || 'candidate';
    this.authMethod = additionalData.authMethod || 'email';
    this.isEmailVerified = additionalData.isEmailVerified || false;
    this.isActive = this._calculateIsActive(userEntity.status);
    this.avatar = getAvatarUrl(userEntity.avatarUrl || additionalData.avatar);
    this.googleProfile = additionalData.googleProfile || null;
    this.preferences = additionalData.preferences || {};
    this.lastLogin = additionalData.lastLogin || null;
    this.createdAt = userEntity.createdAt;
    this.updatedAt = userEntity.updatedAt;
    this.candidateProfile = additionalData.candidateProfile || null;
    this.employerProfile = additionalData.employerProfile || null;
  }

  /**
   * Factory method - tạo DTO từ domain entity
   * @param {User} userEntity - Domain User entity
   * @param {Object} infraData - Additional data từ infrastructure model
   * @returns {UserResponseDTO}
   */
  static fromDomainEntity(userEntity, infraData = {}) {
    return new UserResponseDTO(userEntity, infraData);
  }

  /**
   * Serialize thành plain object cho JSON response
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      authMethod: this.authMethod,
      isEmailVerified: this.isEmailVerified,
      isActive: this.isActive,
      avatar: this.avatar,
      googleProfile: this.googleProfile,
      preferences: this.preferences,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      candidateProfile: this.candidateProfile,
      employerProfile: this.employerProfile,
    };
  }

  /**
   * Calculate if user is active based on status
   * @param {string} status - User status
   * @returns {boolean} - Whether user is considered active
   */
  _calculateIsActive(status) {
    // Consider user active if they can access the platform
    const activeStatuses = ['ACTIVE', 'active', 'PENDING_VERIFICATION'];
    return activeStatuses.includes(status);
  }
}

module.exports = UserResponseDTO;
