const { logger } = require('../../../shared/utils/logger');
const { canManageMembers } = require('../../../shared/utils/permissions');

class InviteMemberUseCase {
  constructor(
    companyInvitationRepository,
    employerRepository,
    companyRepository
  ) {
    this.companyInvitationRepository = companyInvitationRepository;
    this.employerRepository = employerRepository;
    this.companyRepository = companyRepository;
  }

  async execute({ userId, companyId, inviteData }) {
    try {
      // Get inviter's profile
      const inviterProfile = await this.employerRepository.findOne({
        owner: userId,
        company: companyId,
      });

      if (!inviterProfile) {
        throw new Error('INVITER_NOT_MEMBER');
      }

      // Check permission
      if (!canManageMembers(inviterProfile)) {
        throw new Error('NO_PERMISSION_TO_INVITE');
      }

      // Check if email already has pending invitation
      const existingInvitations =
        await this.companyInvitationRepository.findByEmail(
          inviteData.email,
          companyId
        );

      if (existingInvitations.length > 0) {
        throw new Error('INVITATION_ALREADY_SENT');
      }

      // Check if user already member
      const existingMember = await this.employerRepository.findByUserAndCompany(
        inviteData.email,
        companyId
      );

      if (existingMember) {
        throw new Error('USER_ALREADY_MEMBER');
      }

      // Create invitation
      const invitation = await this.companyInvitationRepository.create({
        company: companyId,
        invitedBy: userId,
        email: inviteData.email.toLowerCase(),
        role: inviteData.role || 'recruiter',
        permissions: inviteData.permissions,
        position: inviteData.position,
      });

      logger.info(
        `Member invited: ${inviteData.email} to company: ${companyId}`
      );

      // TODO: Send invitation email
      // await emailService.sendInvitation(invitation);

      return {
        invitation,
        invitationLink: `${process.env.FRONTEND_URL}/invitation/accept/${invitation.token}`,
      };
    } catch (error) {
      logger.error('Invite member failed:', error);
      throw error;
    }
  }
}

module.exports = InviteMemberUseCase;
