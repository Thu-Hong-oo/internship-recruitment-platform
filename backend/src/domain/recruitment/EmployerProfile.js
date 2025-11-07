// src/domain/recruitment/EmployerProfile.js

/**
 * EmployerProfile Domain Entity
 * Pure business logic - no defaults, no infrastructure concerns
 * Represents an employer's profile linked to a company with role and permissions
 */
class EmployerProfile {
  constructor(profileId, userId, companyId) {
    // Required fields only in constructor
    this.profileId = profileId;
    this.userId = userId;
    this.companyId = companyId;

    // Optional fields - no defaults
    this.role = null;
    this.position = null;
    this.permissions = null;
    this.contact = null;
    this.status = null;
    this.joinedAt = null;
    this.company = null; // Populated company object

    // Timestamps
    this.createdAt = null;
    this.updatedAt = null;
  }

  // ==================== BUSINESS METHODS ====================

  /**
   * Update role and associated permissions
   */
  assignRole(role, permissions) {
    this.role = role;
    this.permissions = permissions;
  }

  /**
   * Update position details
   */
  updatePosition(title, level = null, department = null) {
    this.position = {
      title,
      level,
      department,
    };
  }

  /**
   * Activate profile
   */
  activate() {
    if (this.status === 'active') {
      throw new Error('Profile is already active');
    }
    this.status = 'active';
  }

  /**
   * Suspend profile
   */
  suspend() {
    if (this.status === 'suspended') {
      throw new Error('Profile is already suspended');
    }
    this.status = 'suspended';
  }

  // ==================== PERMISSION CHECKS ====================

  canPostJobs() {
    return this.permissions?.canPostJobs === true;
  }

  canEditJobs() {
    return this.permissions?.canEditJobs === true;
  }

  canDeleteJobs() {
    return this.permissions?.canDeleteJobs === true;
  }

  canViewApplications() {
    return this.permissions?.canViewApplications === true;
  }

  canReviewApplications() {
    return this.permissions?.canReviewApplications === true;
  }

  canScheduleInterviews() {
    return this.permissions?.canScheduleInterviews === true;
  }

  canManageMembers() {
    return this.permissions?.canManageMembers === true;
  }

  canEditCompanyInfo() {
    return this.permissions?.canEditCompanyInfo === true;
  }

  // ==================== STATUS CHECKS ====================

  isActive() {
    return this.status === 'active';
  }

  isPending() {
    return this.status === 'pending';
  }

  isSuspended() {
    return this.status === 'suspended';
  }

  isOwner() {
    return this.role === 'owner';
  }

  isAdmin() {
    return this.role === 'admin';
  }
}

module.exports = EmployerProfile;
