const { logger } = require('../../../shared/utils/logger');

class AcceptInvitationUseCase {
  constructor(companyInvitationRepository, employerRepository, userRepository) {
    this.companyInvitationRepository = companyInvitationRepository;
    this.employerRepository = employerRepository;
    this.userRepository = userRepository;
  }

  async execute({ token, userId }) {
    try {
      // Find invitation
      const invitation = await this.companyInvitationRepository.findByToken(
        token
      );

      if (!invitation) {
        throw new Error('INVITATION_NOT_FOUND');
      }

      // Check if expired
      if (invitation.isExpired()) {
        await this.companyInvitationRepository.markAsExpired(invitation._id);
        throw new Error('INVITATION_EXPIRED');
      }

      // Check if already accepted/rejected
      if (invitation.status !== 'pending') {
        throw new Error('INVITATION_ALREADY_PROCESSED');
      }

      // Get user info
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Check if email matches
      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error('EMAIL_MISMATCH');
      }

      // Check if already member
      const existingProfile =
        await this.employerRepository.findByUserAndCompany(
          userId,
          invitation.company._id
        );

      if (existingProfile) {
        throw new Error('ALREADY_MEMBER');
      }

      // Create employer profile
      const profile = await this.employerRepository.create({
        owner: userId,
        company: invitation.company._id,
        role: invitation.role,
        permissions: invitation.permissions,
        position: invitation.position,
        status: 'active',
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        joinedAt: new Date(),
      });

      // Mark invitation as accepted
      await this.companyInvitationRepository.accept(invitation._id);

      logger.info(`Invitation accepted: ${invitation._id} by user: ${userId}`);

      return {
        profile,
        company: invitation.company,
      };
    } catch (error) {
      logger.error('Accept invitation failed:', error);
      throw error;
    }
  }
}

module.exports = AcceptInvitationUseCase;
