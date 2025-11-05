const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for getting candidate applications
 */
class GetCandidateApplicationsUseCase {
  /**
   * @param {IApplicationRepository} applicationRepository
   */
  constructor(applicationRepository) {
    this.applicationRepository = applicationRepository;
  }

  /**
   * Execute the get candidate applications use case
   * @param {Object} input
   * @param {string} input.candidateId - Candidate ID
   * @param {Object} input.filters - Filter criteria
   * @param {Object} input.options - Pagination options
   * @returns {Promise<Object>} Applications result
   */
  async execute({ candidateId, filters, options }) {
    try {
      logger.info('Getting candidate applications', { candidateId, filters, options });

      const result = await this.applicationRepository.findByCandidateId(
        candidateId,
        { ...filters, ...options }
      );

      logger.info('Candidate applications retrieved successfully', {
        candidateId,
        count: result.applications.length,
      });

      return {
        success: true,
        applications: result.applications,
        pagination: result.pagination,
      };
    } catch (error) {
      logger.error('Get candidate applications error:', error);
      throw error;
    }
  }
}

module.exports = GetCandidateApplicationsUseCase;