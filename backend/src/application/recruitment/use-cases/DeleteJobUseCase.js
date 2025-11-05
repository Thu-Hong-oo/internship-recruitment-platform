const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for deleting a job post
 */
class DeleteJobUseCase {
  /**
   * @param {IJobRepository} jobRepository
   */
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  /**
   * Execute the delete job use case
   * @param {Object} input
   * @param {string} input.jobId - Job ID
   * @param {string} input.employerId - Employer ID for authorization
   * @returns {Promise<Object>} Delete result
   */
  async execute({ jobId, employerId }) {
    try {
      logger.info('Deleting job', { jobId, employerId });

      // Get existing job
      const existingJob = await this.jobRepository.findById(jobId);
      if (!existingJob) {
        throw new Error('JOB_NOT_FOUND');
      }

      // Check authorization
      if (existingJob.employerId.toString() !== employerId) {
        throw new Error('UNAUTHORIZED');
      }

      // Delete job
      const deleted = await this.jobRepository.deleteById(jobId);
      if (!deleted) {
        throw new Error('JOB_DELETE_FAILED');
      }

      logger.info('Job deleted successfully', { jobId });

      return {
        success: true,
        message: 'Job deleted successfully',
      };
    } catch (error) {
      logger.error('Delete job error:', error);
      throw error;
    }
  }
}

module.exports = DeleteJobUseCase;
