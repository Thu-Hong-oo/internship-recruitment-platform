const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for updating a job post
 */
class UpdateJobUseCase {
  /**
   * @param {IJobRepository} jobRepository
   * @param {ValidationService} validationService
   */
  constructor(jobRepository, validationService) {
    this.jobRepository = jobRepository;
    this.validationService = validationService;
  }

  /**
   * Execute the update job use case
   * @param {Object} input
   * @param {string} input.jobId - Job ID
   * @param {Object} input.updateData - Data to update
   * @param {string} input.employerId - Employer ID for authorization
   * @returns {Promise<Object>} Updated job result
   */
  async execute({ jobId, updateData, employerId }) {
    try {
      logger.info('Updating job', { jobId, employerId });

      // Get existing job
      const existingJob = await this.jobRepository.findById(jobId);
      if (!existingJob) {
        throw new Error('JOB_NOT_FOUND');
      }

      // Check authorization
      if (existingJob.employerId.toString() !== employerId) {
        throw new Error('UNAUTHORIZED');
      }

      // Validate update data if provided
      if (updateData && Object.keys(updateData).length > 0) {
        const validation = this.validationService.validateJobUpdate(updateData);
        if (!validation.isValid) {
          throw new Error(
            `Job update validation failed: ${validation.errors.join(', ')}`
          );
        }
      }

      // Update job
      const updatedJob = await this.jobRepository.updateById(jobId, updateData);
      if (!updatedJob) {
        throw new Error('JOB_UPDATE_FAILED');
      }

      logger.info('Job updated successfully', { jobId });

      return {
        success: true,
        job: updatedJob,
        message: 'Job updated successfully',
      };
    } catch (error) {
      logger.error('Update job error:', error);
      throw error;
    }
  }
}

module.exports = UpdateJobUseCase;
