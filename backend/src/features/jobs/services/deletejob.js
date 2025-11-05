/**
 * Use case for deleting a job post
 */
const deleteJob = ({}) => {
  /**
   * Execute the delete job use case
   * @param {Object} input
   * @param {string} input.jobId - Job ID
   * @param {string} input.employerId - Employer ID for authorization
   * @returns {Promise<Object>} Delete result
   */
  return async ({ jobId, employerId }) => {
    try {
      logger.info('Deleting job', { jobId, employerId });

      // Get existing job
      const existingJob = await jobRepository.findById(jobId);
      if (!existingJob) {
        throw new Error('JOB_NOT_FOUND');
      }

      // Check authorization
      if (existingJob.employerId.toString() !== employerId) {
        throw new Error('UNAUTHORIZED');
      }

      // Delete job
      const deleted = await jobRepository.deleteById(jobId);
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
  };
};

module.exports = deleteJob;
