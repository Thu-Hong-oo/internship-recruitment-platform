// src/domain/recruitment/CompanyMember.js
const CompanyRole = require('./CompanyRole');
const MemberStatus = require('./MemberStatus');

class CompanyMember {
  constructor(
    memberId,
    companyId,
    userId,
    role = CompanyRole.EMPLOYEE,
    status = MemberStatus.PENDING
  ) {
    this.memberId = memberId;
    this.companyId = companyId;
    this.userId = userId;
    this.role = role;
    this.status = status;
    this.invitedBy = null;
    this.invitedAt = null;
    this.joinedAt = null;
    this.permissions = [];
  }

  changeRole(newRole) {
    if (!CompanyRole.isValid(newRole)) {
      throw new Error('Invalid company role');
    }
    this.role = newRole;
  }

  activate() {
    this.status = MemberStatus.ACTIVE;
    this.joinedAt = new Date();
  }

  deactivate() {
    this.status = MemberStatus.INACTIVE;
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  setInvitedBy(invitedBy, invitedAt) {
    this.invitedBy = invitedBy;
    this.invitedAt = invitedAt;
  }
}

module.exports = CompanyMember;
