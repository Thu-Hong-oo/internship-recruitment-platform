// src/domain/recruitment/entities/Employer.js
const { User } = require('../../identity');
const CompanyRole = require('../CompanyRole');
const MemberStatus = require('../MemberStatus');

class Employer extends User {
  constructor(
    userId,
    email,
    fullName,
    avatarUrl = null,
    password,
    role,
    status,
    lastLogin = null,
    oauthCredentials = [],
    companyRole = CompanyRole.EMPLOYEE,
    memberStatus = MemberStatus.PENDING,
    invitedBy = null,
    invitedAt = null,
    joinedAt = null
  ) {
    super(
      userId,
      email,
      fullName,
      avatarUrl,
      password,
      role,
      status,
      lastLogin,
      oauthCredentials
    );
    this.companyRole = companyRole;
    this.memberStatus = memberStatus;
    this.invitedBy = invitedBy;
    this.invitedAt = invitedAt;
    this.joinedAt = joinedAt;
  }

  changeRole(newRole) {
    if (!Object.values(CompanyRole).includes(newRole)) {
      throw new Error('Invalid company role');
    }
    this.companyRole = newRole;
  }

  activate() {
    this.memberStatus = MemberStatus.ACTIVE;
    this.joinedAt = new Date();
  }

  deactivate() {
    this.memberStatus = MemberStatus.INACTIVE;
  }

  hasPermission(permission) {
    // Define permissions based on company role
    const rolePermissions = {
      [CompanyRole.OWNER]: ['all'],
      [CompanyRole.ADMIN]: ['manage_members', 'post_jobs'],
      [CompanyRole.HR_MANAGER]: ['post_jobs', 'review_applications'],
      [CompanyRole.RECRUITER]: ['post_jobs', 'review_applications'],
      [CompanyRole.EMPLOYEE]: ['view_jobs'],
      [CompanyRole.VIEWER]: ['view_company'],
    };

    const permissions = rolePermissions[this.companyRole] || [];
    return permissions.includes('all') || permissions.includes(permission);
  }

  reviewApplication(applicationId, status) {
    // Business logic for reviewing application
    // This would typically involve calling a service
    return { applicationId, status, reviewedBy: this.userId };
  }
}

module.exports = Employer;
