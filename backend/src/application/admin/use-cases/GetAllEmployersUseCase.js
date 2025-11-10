const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for getting all employers
 */
class GetAllEmployersUseCase {
  /**
   * @param {IAdminRepository} adminRepository
   */
  constructor(adminRepository) {
    this.adminRepository = adminRepository;
  }

  /**
   * Execute the get all employers use case
   * @param {Object} input
   * @param {Object} input.options - Pagination and filter options
   * @returns {Promise<Object>} Employers result with pagination
   */
  async execute({ options }) {
    try {
      logger.info('Getting all employers', { options });

      const result = await this.adminRepository.getAllEmployers(options);

      logger.info('Employers retrieved successfully', {
        count: result.employers.length,
        total: result.total,
      });

      return {
        success: true,
        employers: result.employers,
        pagination: result.pagination,
      };
    } catch (error) {
      logger.error('Get all employers error:', error);
      throw error;
    }
  }
}

module.exports = GetAllEmployersUseCase;