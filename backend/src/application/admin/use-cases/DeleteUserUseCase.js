const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * DeleteUserUseCase
 * Application layer use case for deleting a user
 */
class DeleteUserUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await this.adminRepository.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      throw new Error('Cannot delete admin users');
    }

    const deleted = await this.adminRepository.deleteUserById(userId);

    if (!deleted) {
      throw new Error('Failed to delete user');
    }

    return {
      message: 'User deleted successfully',
    };
  }
}

module.exports = DeleteUserUseCase;
