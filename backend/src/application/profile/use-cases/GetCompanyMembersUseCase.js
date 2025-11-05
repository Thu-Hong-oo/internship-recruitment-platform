const { logger } = require('../../../shared/utils/logger');

class GetCompanyMembersUseCase {
  constructor(companyRepository, employerRepository) {
    this.companyRepository = companyRepository;
    this.employerRepository = employerRepository;
  }

  async execute({ userId, companyId }) {
    try {
      // Get requester's profile
      const requesterProfile = await this.employerRepository.findOne({
        owner: userId,
        company: companyId,
      });

      if (!requesterProfile) {
        throw new Error('NOT_COMPANY_MEMBER');
      }

      // Get all members
      const members = await this.companyRepository.getMembers(companyId);

      logger.info(
        `Retrieved ${members.length} members for company: ${companyId}`
      );

      return {
        members: members.map(member => ({
          id: member._id,
          user: member.owner,
          role: member.role,
          permissions: member.permissions,
          position: member.position,
          status: member.status,
          joinedAt: member.joinedAt,
          invitedBy: member.invitedBy,
        })),
      };
    } catch (error) {
      logger.error('Get company members failed:', error);
      throw error;
    }
  }
}

module.exports = GetCompanyMembersUseCase;
