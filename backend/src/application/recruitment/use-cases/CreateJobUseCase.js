const { logger } = require('../../../shared/utils/logger');
const JobPosting = require('../../../domain/recruitment/JobPosting');

/**
 * Use case for creating a new job post
 * Uses JobPosting Domain Entity for business logic
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

      // Create JobPosting Domain Entity (correct constructor params)
      const jobPosting = new JobPosting(
        null, // id - will be assigned by repository
        jobData.title,
        jobData.description,
        employer.companyId
      );

      // Set required fields
      jobPosting.employerId = employerId;
      jobPosting.status = 'draft';
      jobPosting.location = jobData.location;
      jobPosting.jobType = jobData.jobType;

      // Set salary range if provided (using business method)
      if (jobData.salaryMin && jobData.salaryMax) {
        jobPosting.setSalaryRange(
          jobData.salaryMin,
          jobData.salaryMax,
          jobData.salaryCurrency || 'VND'
        );
      }

      // Initialize arrays
      jobPosting.requirements = [];
      jobPosting.skills = [];
      jobPosting.benefits = [];

      // Add requirements (domain logic prevents duplicates)
      if (jobData.requirements && Array.isArray(jobData.requirements)) {
        jobData.requirements.forEach(req => jobPosting.addRequirement(req));
      }

      // Add skills (domain logic prevents duplicates)
      if (jobData.skills && Array.isArray(jobData.skills)) {
        jobData.skills.forEach(skill => jobPosting.addSkill(skill));
      }

      // Set additional fields
      if (jobData.experience) jobPosting.experience = jobData.experience;
      if (jobData.education) jobPosting.education = jobData.education;
      if (jobData.benefits && Array.isArray(jobData.benefits)) {
        jobData.benefits.forEach(benefit => jobPosting.benefits.push(benefit));
      }
      if (jobData.deadline) jobPosting.deadline = new Date(jobData.deadline);
      if (jobData.numberOfPositions)
        jobPosting.numberOfPositions = jobData.numberOfPositions;

      // Initialize counters
      jobPosting.viewCount = 0;
      jobPosting.applicationCount = 0;

      // Save through repository (returns domain entity)
      const savedJob = await this.jobRepository.create(jobPosting);

      logger.info('Job post created successfully', { jobId: savedJob.id });

      return {
        success: true,
        job: savedJob, // Domain entity
        message: 'Job post created successfully',
      };
    } catch (error) {
      logger.error('Create job post error:', error);
      throw error;
    }
  }
}

module.exports = CreateJobUseCase;
