const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for applying for a job
 */
class ApplyForJobUseCase {
  /**
   * @param {IApplicationRepository} applicationRepository
   * @param {ICandidateRepository} candidateRepository
   * @param {IJobRepository} jobRepository
   */
  constructor(applicationRepository, candidateRepository, jobRepository) {
    this.applicationRepository = applicationRepository;
    this.candidateRepository = candidateRepository;
    this.jobRepository = jobRepository;
  }

  /**
   * Execute the apply for job use case
   * @param {Object} input
   * @param {string} input.candidateId - Candidate ID
   * @param {string} input.jobId - Job ID
   * @param {Object} input.applicationData - Application data
   * @returns {Promise<Object>} Application result
   */
  async execute({ candidateId, jobId, applicationData }) {
    try {
      logger.info('Applying for job', { candidateId, jobId });

      // Check if candidate exists
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      // Check if job exists and is published
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new Error('JOB_NOT_FOUND');
      }
      if (job.status !== 'published') {
        throw new Error('JOB_NOT_AVAILABLE');
      }

      // Check if candidate has already applied
      const hasApplied =
        await this.applicationRepository.hasCandidateAppliedForJob(
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

      const application = await this.applicationRepository.create(
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
  }
}

module.exports = ApplyForJobUseCase;
