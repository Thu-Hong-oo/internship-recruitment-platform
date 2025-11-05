/**
 * CompanyInvitation Domain Entity
 * Represents an invitation for a user to join a company with specific role and permissions
 *
 * Business Rules:
 * - Must have a valid email and company
 * - Token is unique and used for accepting invitation
 * - Expires after a configurable period (default 7 days)
 * - Can only be accepted if not expired or already processed
 * - Different roles have different default permissions
 * - Once accepted or rejected, cannot be modified
 */

const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};

const CompanyRole = {
  ADMIN: 'ADMIN', // Full access
  RECRUITER: 'RECRUITER', // Can manage jobs and applications
  INTERVIEWER: 'INTERVIEWER', // Can review applications and schedule interviews
  VIEWER: 'VIEWER', // Read-only access
};

class CompanyInvitation {
  constructor(
    id,
    companyId,
    invitedBy,
    email,
    role,
    permissions,
    position = null,
    status = InvitationStatus.PENDING,
    token = null,
    expiresAt = null,
    acceptedAt = null,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.companyId = companyId;
    this.invitedBy = invitedBy;
    this.email = email ? email.toLowerCase() : null;
    this.role = role;
    this.permissions = permissions || this.getDefaultPermissions(role);
    this.position = position;
    this.status = status;
    this.token = token;
    this.expiresAt = expiresAt || this.calculateExpiryDate();
    this.acceptedAt = acceptedAt;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    if (!this.id) {
      throw new Error('Invitation ID is required');
    }

    if (!this.companyId) {
      throw new Error('Company ID is required');
    }

    if (!this.invitedBy) {
      throw new Error('Inviter ID is required');
    }

    if (!this.email) {
      throw new Error('Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.role || !Object.values(CompanyRole).includes(this.role)) {
      throw new Error('Valid role is required');
    }

    if (
      !this.status ||
      !Object.values(InvitationStatus).includes(this.status)
    ) {
      throw new Error('Valid status is required');
    }

    if (!this.permissions) {
      throw new Error('Permissions are required');
    }

    this.validatePermissions();
  }

  validatePermissions() {
    const requiredPermissions = [
      'canPostJobs',
      'canEditJobs',
      'canDeleteJobs',
      'canViewApplications',
      'canReviewApplications',
      'canScheduleInterviews',
      'canManageMembers',
      'canEditCompanyInfo',
    ];

    for (const perm of requiredPermissions) {
      if (typeof this.permissions[perm] !== 'boolean') {
        throw new Error(`Permission ${perm} must be a boolean`);
      }
    }
  }

  // ============================================
  // Default Permissions by Role
  // ============================================

  getDefaultPermissions(role) {
    const permissions = {
      canPostJobs: false,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewApplications: false,
      canReviewApplications: false,
      canScheduleInterviews: false,
      canManageMembers: false,
      canEditCompanyInfo: false,
    };

    switch (role) {
      case CompanyRole.ADMIN:
        // Admin has all permissions
        return {
          canPostJobs: true,
          canEditJobs: true,
          canDeleteJobs: true,
          canViewApplications: true,
          canReviewApplications: true,
          canScheduleInterviews: true,
          canManageMembers: true,
          canEditCompanyInfo: true,
        };

      case CompanyRole.RECRUITER:
        return {
          ...permissions,
          canPostJobs: true,
          canEditJobs: true,
          canViewApplications: true,
          canReviewApplications: true,
          canScheduleInterviews: true,
        };

      case CompanyRole.INTERVIEWER:
        return {
          ...permissions,
          canViewApplications: true,
          canReviewApplications: true,
          canScheduleInterviews: true,
        };

      case CompanyRole.VIEWER:
        return {
          ...permissions,
          canViewApplications: true,
        };

      default:
        return permissions;
    }
  }

  // ============================================
  // Status Management
  // ============================================

  accept() {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Only pending invitations can be accepted');
    }

    if (this.isExpired()) {
      throw new Error('Cannot accept expired invitation');
    }

    this.status = InvitationStatus.ACCEPTED;
    this.acceptedAt = new Date();
    this.updatedAt = new Date();
  }

  reject() {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Only pending invitations can be rejected');
    }

    if (this.isExpired()) {
      throw new Error('Cannot reject expired invitation');
    }

    this.status = InvitationStatus.REJECTED;
    this.updatedAt = new Date();
  }

  markAsExpired() {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Only pending invitations can be marked as expired');
    }

    this.status = InvitationStatus.EXPIRED;
    this.updatedAt = new Date();
  }

  isPending() {
    return this.status === InvitationStatus.PENDING && !this.isExpired();
  }

  isAccepted() {
    return this.status === InvitationStatus.ACCEPTED;
  }

  isRejected() {
    return this.status === InvitationStatus.REJECTED;
  }

  isProcessed() {
    return this.status !== InvitationStatus.PENDING;
  }

  // ============================================
  // Expiry Management
  // ============================================

  calculateExpiryDate(days = 7) {
    const now = new Date();
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  isExpired() {
    if (this.status === InvitationStatus.EXPIRED) {
      return true;
    }

    if (!this.expiresAt) {
      return false;
    }

    return new Date() > this.expiresAt;
  }

  getExpiryTimeRemaining() {
    if (this.isExpired()) {
      return 0;
    }

    const now = new Date();
    const remaining = this.expiresAt - now;
    return Math.max(0, remaining);
  }

  getExpiryTimeRemainingInHours() {
    return Math.floor(this.getExpiryTimeRemaining() / (1000 * 60 * 60));
  }

  getExpiryTimeRemainingInDays() {
    return Math.floor(this.getExpiryTimeRemainingInHours() / 24);
  }

  willExpireSoon(hours = 24) {
    if (this.isExpired()) {
      return false;
    }

    return this.getExpiryTimeRemainingInHours() < hours;
  }

  extendExpiry(additionalDays = 7) {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Can only extend pending invitations');
    }

    const newExpiryDate = new Date(
      this.expiresAt.getTime() + additionalDays * 24 * 60 * 60 * 1000
    );
    this.expiresAt = newExpiryDate;
    this.updatedAt = new Date();
  }

  // ============================================
  // Permission Management
  // ============================================

  updatePermissions(newPermissions) {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error(
        'Cannot update permissions after invitation is processed'
      );
    }

    this.permissions = { ...this.permissions, ...newPermissions };
    this.validatePermissions();
    this.updatedAt = new Date();
  }

  grantPermission(permissionName) {
    if (!this.permissions.hasOwnProperty(permissionName)) {
      throw new Error(`Invalid permission: ${permissionName}`);
    }

    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Cannot grant permissions after invitation is processed');
    }

    this.permissions[permissionName] = true;
    this.updatedAt = new Date();
  }

  revokePermission(permissionName) {
    if (!this.permissions.hasOwnProperty(permissionName)) {
      throw new Error(`Invalid permission: ${permissionName}`);
    }

    if (this.status !== InvitationStatus.PENDING) {
      throw new Error(
        'Cannot revoke permissions after invitation is processed'
      );
    }

    this.permissions[permissionName] = false;
    this.updatedAt = new Date();
  }

  hasPermission(permissionName) {
    return this.permissions[permissionName] === true;
  }

  getAllPermissions() {
    return { ...this.permissions };
  }

  getGrantedPermissions() {
    return Object.keys(this.permissions).filter(
      key => this.permissions[key] === true
    );
  }

  // ============================================
  // Role Management
  // ============================================

  changeRole(newRole) {
    if (!Object.values(CompanyRole).includes(newRole)) {
      throw new Error('Invalid role');
    }

    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Cannot change role after invitation is processed');
    }

    this.role = newRole;
    // Reset permissions to default for new role
    this.permissions = this.getDefaultPermissions(newRole);
    this.updatedAt = new Date();
  }

  isAdmin() {
    return this.role === CompanyRole.ADMIN;
  }

  isRecruiter() {
    return this.role === CompanyRole.RECRUITER;
  }

  isInterviewer() {
    return this.role === CompanyRole.INTERVIEWER;
  }

  isViewer() {
    return this.role === CompanyRole.VIEWER;
  }

  // ============================================
  // Position Management
  // ============================================

  setPosition(title, department = null) {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Cannot set position after invitation is processed');
    }

    this.position = {
      title: title || null,
      department: department || null,
    };
    this.updatedAt = new Date();
  }

  hasPosition() {
    return (
      this.position !== null &&
      (this.position.title || this.position.department)
    );
  }

  // ============================================
  // Token Management
  // ============================================

  setToken(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    this.token = token;
    this.updatedAt = new Date();
  }

  // ============================================
  // Business Logic Queries
  // ============================================

  canBeAccepted() {
    return this.isPending() && !this.isExpired();
  }

  canBeRejected() {
    return this.isPending() && !this.isExpired();
  }

  canBeResent() {
    return this.status === InvitationStatus.REJECTED || this.isExpired();
  }

  canBeModified() {
    return this.status === InvitationStatus.PENDING && !this.isExpired();
  }

  shouldSendReminder() {
    return this.isPending() && !this.isExpired() && this.willExpireSoon(48);
  }

  getInvitationAge() {
    if (!this.createdAt) {
      return 0;
    }

    return new Date() - this.createdAt;
  }

  getInvitationAgeInDays() {
    return Math.floor(this.getInvitationAge() / (1000 * 60 * 60 * 24));
  }

  // ============================================
  // Display Information
  // ============================================

  getDisplayStatus() {
    if (this.isExpired()) {
      return 'Expired';
    }

    switch (this.status) {
      case InvitationStatus.PENDING:
        return 'Pending';
      case InvitationStatus.ACCEPTED:
        return 'Accepted';
      case InvitationStatus.REJECTED:
        return 'Rejected';
      case InvitationStatus.EXPIRED:
        return 'Expired';
      default:
        return this.status;
    }
  }

  getRoleDisplayName() {
    switch (this.role) {
      case CompanyRole.ADMIN:
        return 'Administrator';
      case CompanyRole.RECRUITER:
        return 'Recruiter';
      case CompanyRole.INTERVIEWER:
        return 'Interviewer';
      case CompanyRole.VIEWER:
        return 'Viewer';
      default:
        return this.role;
    }
  }

  getSummary() {
    return {
      id: this.id,
      email: this.email,
      role: this.getRoleDisplayName(),
      status: this.getDisplayStatus(),
      expiresIn: this.getExpiryTimeRemainingInDays(),
      canBeAccepted: this.canBeAccepted(),
      grantedPermissions: this.getGrantedPermissions().length,
      createdAt: this.createdAt,
    };
  }
}

// Export class and constants
CompanyInvitation.Status = InvitationStatus;
CompanyInvitation.Role = CompanyRole;

module.exports = CompanyInvitation;
