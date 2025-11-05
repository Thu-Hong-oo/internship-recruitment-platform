const { logger } = require('../../../shared/utils/logger');

/**
 * Create job service
 * @param {Object} dependencies
 * @param {IJobRepository} dependencies.jobRepository
 * @param {IEmployerRepository} dependencies.employerRepository
 * @param {ICompanyRepository} dependencies.companyRepository
 * @param {ValidationService} dependencies.validationService
 */
const createJob = ({
  jobRepository,
  employerRepository,
  companyRepository,
  validationService,
}) => {
  return async ({ employerId, jobData }) => {
    try {
      logger.info('Creating job post', { employerId, title: jobData.title });

      // Validate job data
      const validation = validationService.validateJob(jobData);
      if (!validation.isValid) {
        throw new Error(
          `Job validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Get employer's company
      const employer = await employerRepository.findById(employerId);
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

      const jobPost = await jobRepository.create(jobPostData);

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
  };
};

module.exports = createJob;
