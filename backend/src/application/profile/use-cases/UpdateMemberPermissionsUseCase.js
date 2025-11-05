const { logger } = require('../../../shared/utils/logger');
const {
  canManageMembers,
  getPermissionsForRole,
} = require('../../../shared/utils/permissions');

class UpdateMemberPermissionsUseCase {
  constructor(employerRepository) {
    this.employerRepository = employerRepository;
  }

  async execute({ userId, companyId, memberId, updates }) {
    try {
      // Get requester's profile
      const requesterProfile = await this.employerRepository.findOne({
        owner: userId,
        company: companyId,
      });

      if (!requesterProfile) {
        throw new Error('NOT_COMPANY_MEMBER');
      }

      // Check permission
      if (!canManageMembers(requesterProfile)) {
        throw new Error('NO_PERMISSION_TO_MANAGE');
      }

      // Get member profile
      const memberProfile = await this.employerRepository.findById(memberId);

      if (!memberProfile || memberProfile.company.toString() !== companyId) {
        throw new Error('MEMBER_NOT_FOUND');
      }

      // Cannot modify owner
      if (memberProfile.role === 'owner') {
        throw new Error('CANNOT_MODIFY_OWNER');
      }

      // Prepare update data
      const updateData = {};

      if (updates.role) {
        updateData.role = updates.role;
        // Auto-set permissions based on role
        updateData.permissions = getPermissionsForRole(updates.role);
      }

      if (updates.permissions) {
        // Custom permissions (override role defaults)
        updateData.permissions = {
          ...updateData.permissions,
          ...updates.permissions,
        };
      }

      if (updates.position) {
        updateData.position = updates.position;
      }

      if (updates.status) {
        updateData.status = updates.status;
      }

      // Update member
      const updatedMember = await this.employerRepository.update(
        memberId,
        updateData
      );

      logger.info(
        `Member permissions updated: ${memberId} in company: ${companyId}`
      );

      return {
        member: updatedMember,
      };
    } catch (error) {
      logger.error('Update member permissions failed:', error);
      throw error;
    }
  }
}

module.exports = UpdateMemberPermissionsUseCase;
