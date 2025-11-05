const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for getting a job by ID
 */
class GetJobUseCase {
  /**
   * @param {IJobRepository} jobRepository
   */
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  /**
   * Execute the get job use case
   * @param {Object} input
   * @param {string} input.jobId - Job ID
   * @returns {Promise<Object>} Job result
   */
  async execute({ jobId }) {
    try {
      logger.info('Getting job by ID', { jobId });

      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new Error('JOB_NOT_FOUND');
      }

      logger.info('Job retrieved successfully', { jobId });

      return {
        success: true,
        job,
      };
    } catch (error) {
      logger.error('Get job error:', error);
      throw error;
    }
  }
}

module.exports = GetJobUseCase;
