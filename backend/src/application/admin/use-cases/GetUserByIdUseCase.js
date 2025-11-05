const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetUserByIdUseCase
 * Application layer use case for getting a user by ID
 */
class GetUserByIdUseCase {
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

    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile,
      },
    };
  }
}

module.exports = GetUserByIdUseCase;
