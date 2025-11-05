/**
 * Use case for applying for a job
 */
const applyForJob = ({}) => {
  /**
   * Execute the apply for job use case
   * @param {Object} input
   * @param {string} input.candidateId - Candidate ID
   * @param {string} input.jobId - Job ID
   * @param {Object} input.applicationData - Application data
   * @returns {Promise<Object>} Application result
   */
  return async ({ candidateId, jobId, applicationData }) => {
    try {
      logger.info('Applying for job', { candidateId, jobId });

      // Check if candidate exists
      const candidate = await candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      // Check if job exists and is published
      const job = await jobRepository.findById(jobId);
      if (!job) {
        throw new Error('JOB_NOT_FOUND');
      }
      if (job.status !== 'published') {
        throw new Error('JOB_NOT_AVAILABLE');
      }

      // Check if candidate has already applied
      const hasApplied = await applicationRepository.hasCandidateAppliedForJob(
        candidateId,
        jobId
      );
      if (hasApplied) {
        throw new Error('ALREADY_APPLIED');
      }

      // Create application
      const applicationDataToCreate = {
        candidateId,
        jobId,
        ...applicationData,
        status: 'pending',
      };

      const application = await applicationRepository.create(
        applicationDataToCreate
      );

      logger.info('Application created successfully', {
        applicationId: application._id,
      });

      return {
        success: true,
        application,
        message: 'Ứng tuyển thành công',
      };
    } catch (error) {
      logger.error('Apply for job error:', error);
      throw error;
    }
  };
};

module.exports = applyForJob;
