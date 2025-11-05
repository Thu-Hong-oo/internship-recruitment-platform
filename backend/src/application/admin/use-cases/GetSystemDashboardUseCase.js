const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for getting system dashboard
 */
class GetSystemDashboardUseCase {
  /**
   * @param {IAdminRepository} adminRepository
   */
  constructor(adminRepository) {
    this.adminRepository = adminRepository;
  }

  /**
   * Execute the get system dashboard use case
   * @returns {Promise<Object>} Dashboard result
   */
  async execute() {
    try {
      logger.info('Getting system dashboard');

      const dashboard = await this.adminRepository.getSystemDashboard();

      logger.info('System dashboard retrieved successfully');

      return {
        success: true,
        dashboard,
      };
    } catch (error) {
      logger.error('Get system dashboard error:', error);
      throw error;
    }
  }
}

module.exports = GetSystemDashboardUseCase;
