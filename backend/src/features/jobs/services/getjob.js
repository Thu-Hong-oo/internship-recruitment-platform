/**
 * Use case for getting a job by ID
 */
const getJob = ({}) => {
  /**
   * Execute the get job use case
   * @param {Object} input
   * @param {string} input.jobId - Job ID
   * @returns {Promise<Object>} Job result
   */
  return async ({ jobId }) => {
    try {
      logger.info('Getting job by ID', { jobId });

      const job = await jobRepository.findById(jobId);
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
  };
};

module.exports = getJob;
