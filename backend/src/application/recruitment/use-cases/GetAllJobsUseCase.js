const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for getting all jobs with filtering and pagination
 */
class GetAllJobsUseCase {
  /**
   * @param {IJobRepository} jobRepository
   */
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  /**
   * Execute the get all jobs use case
   * @param {Object} input
   * @param {Object} input.filters - Filter criteria
   * @param {Object} input.options - Pagination and sorting options
   * @param {string} input.userRole - User role for access control
   * @returns {Promise<Object>} Jobs result with pagination
   */
  async execute({ filters, options, userRole }) {
    try {
      logger.info('Getting all jobs', { filters, options });

      // Apply access control based on user role
      const accessFilters = this.applyAccessControl(filters, userRole);

      const result = await this.jobRepository.findAll(accessFilters, options);

      logger.info('Jobs retrieved successfully', {
        count: result.jobs.length,
        total: result.total,
      });

      return {
        success: true,
        jobs: result.jobs,
        pagination: result.pagination,
        filters: result.filters,
      };
    } catch (error) {
      logger.error('Get all jobs error:', error);
      throw error;
    }
  }

  /**
   * Apply access control filters based on user role
   * @param {Object} filters - Original filters
   * @param {string} userRole - User role
   * @returns {Object} Filters with access control applied
   */
  applyAccessControl(filters, userRole) {
    const accessFilters = { ...filters };

    if (userRole !== 'admin') {
      // Public users only see published jobs
      accessFilters.status = 'published';
    } else {
      // Admin can see all except archived unless explicitly requested
      if (!filters.includeDeleted) {
        accessFilters.status = { $ne: 'archived' };
      }
    }

    return accessFilters;
  }
}

module.exports = GetAllJobsUseCase;
