const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * UpdateUserStatusUseCase
 * Application layer use case for updating user status
 */
class UpdateUserStatusUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(userId, statusData) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!statusData || !statusData.status) {
      throw new Error('Status is required');
    }

    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    if (!validStatuses.includes(statusData.status)) {
      throw new Error(
        'Invalid status. Must be one of: ' + validStatuses.join(', ')
      );
    }

    const user = await this.adminRepository.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.adminRepository.updateUserById(userId, {
      status: statusData.status,
      updatedAt: new Date(),
    });

    return {
      message: 'User status updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }
}

module.exports = UpdateUserStatusUseCase;
