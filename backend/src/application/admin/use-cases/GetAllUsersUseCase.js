const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for getting all users
 */
class GetAllUsersUseCase {
  /**
   * @param {IAdminRepository} adminRepository
   */
  constructor(adminRepository) {
    this.adminRepository = adminRepository;
  }

  /**
   * Execute the get all users use case
   * @param {Object} input
   * @param {Object} input.options - Pagination and filter options
   * @returns {Promise<Object>} Users result with pagination
   */
  async execute({ options }) {
    try {
      logger.info('Getting all users', { options });

      const result = await this.adminRepository.getAllUsers(options);

      logger.info('Users retrieved successfully', {
        count: result.users.length,
        total: result.total,
      });

      return {
        success: true,
        users: result.users,
        pagination: result.pagination,
      };
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  }
}

module.exports = GetAllUsersUseCase;
