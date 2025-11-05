// src/domain/recruitment/CompanyInvitation.js
const InvitationStatus = require('./InvitationStatus');
const CompanyRole = require('./CompanyRole');

class CompanyInvitation {
  constructor(invitationId, companyId, email, role, invitedBy) {
    this.invitationId = invitationId;
    this.companyId = companyId;
    this.email = email;
    this.role = role;
    this.invitedBy = invitedBy;
    this.invitedAt = new Date();
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    this.status = InvitationStatus.PENDING;
    this.token = this.generateToken();
  }

  accept(userId) {
    this.status = InvitationStatus.ACCEPTED;
    // Logic to create CompanyMember would go here
  }

  reject() {
    this.status = InvitationStatus.REJECTED;
  }

  expire() {
    this.status = InvitationStatus.EXPIRED;
  }

  isExpired() {
    return new Date() > this.expiresAt;
  }

  generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

module.exports = CompanyInvitation;
