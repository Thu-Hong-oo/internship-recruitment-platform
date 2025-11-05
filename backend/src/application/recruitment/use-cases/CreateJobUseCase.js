const { logger } = require('../../../shared/utils/logger');

/**
 * Use case for creating a new job post
 */
class CreateJobUseCase {
  /**
   * @param {IJobRepository} jobRepository
   * @param {IEmployerRepository} employerRepository
   * @param {ICompanyRepository} companyRepository
   * @param {ValidationService} validationService
   */
  constructor(
    jobRepository,
    employerRepository,
    companyRepository,
    validationService
  ) {
    this.jobRepository = jobRepository;
    this.employerRepository = employerRepository;
    this.companyRepository = companyRepository;
    this.validationService = validationService;
  }

  /**
   * Execute the create job use case
   * @param {Object} input
   * @param {string} input.employerId - Employer ID
   * @param {Object} input.jobData - Job data
   * @returns {Promise<Object>} Created job result
   */
  async execute({ employerId, jobData }) {
    try {
      logger.info('Creating job post', { employerId, title: jobData.title });

      // Validate job data
      const validation = this.validationService.validateJob(jobData);
      if (!validation.isValid) {
        throw new Error(
          `Job validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Get employer's company
      const employer = await this.employerRepository.findById(employerId);
      if (!employer || !employer.companyId) {
        throw new Error('Employer company not found');
      }

      // Create job post
      const jobPostData = {
        ...jobData,
        employerId,
        companyId: employer.companyId,
        status: 'draft',
      };

      const jobPost = await this.jobRepository.create(jobPostData);

      logger.info('Job post created successfully', { jobId: jobPost._id });

      return {
        success: true,
        job: jobPost,
        message: 'Job post created successfully',
      };
    } catch (error) {
      logger.error('Create job post error:', error);
      throw error;
    }
  }
}

module.exports = CreateJobUseCase;
