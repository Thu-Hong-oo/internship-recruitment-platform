const { logger } = require('../../../shared/utils/logger');
const JobPosting = require('../../../domain/recruitment/JobPosting');
const ValidationService = require('../../../infrastructure/services/internal/ValidationService');
const EmployerRepository = require('../../../infrastructure/repositories/EmployerRepository');
const CompanyRepository = require('../../../infrastructure/repositories/CompanyRepository');
const JobRepository = require('../../../infrastructure/repositories/JobRepository');

/**
 * Use case for creating a new job post
 * Uses JobPosting Domain Entity for business logic
 */
class CreateJobUseCase {
  /**
   * Constructor - create repositories directly to avoid DI issues
   */
  constructor() {
    this.jobRepository = new JobRepository();
    this.employerRepository = new EmployerRepository();
    this.companyRepository = new CompanyRepository();
    this.validationService = new ValidationService();
    console.log(
      'CreateJobUseCase constructor - validationService:',
      !!this.validationService
    );
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
      console.log('Employer found:', employer);
      console.log('Employer companyId:', employer?.companyId);
      if (!employer || !employer.companyId) {
        throw new Error('Employer company not found');
      }

      // Validate company verification status
      if (!employer.company || employer.company.status !== 'active') {
        throw new Error(
          'Company must be verified and active before posting jobs. Please complete your company verification process.'
        );
      }

      if (
        employer.company.verification &&
        !employer.company.verification.isVerified
      ) {
        throw new Error(
          'Company verification is required before posting jobs. Please upload required documents and wait for approval.'
        );
      }

      // Create JobPosting Domain Entity (correct constructor params)
      const jobId = `JOB_${Date.now()}_${employerId.toString().slice(-6)}`;
      const jobPosting = new JobPosting(
        jobId,
        jobData.title,
        jobData.description,
        employer.companyId
      );

      // Set required fields
      jobPosting.employerId = employerId;
      jobPosting.status = 'draft';
      console.log('JobPosting status after set:', jobPosting.status);
      jobPosting.location = jobData.location;
      jobPosting.jobType = jobData.jobType;

      // Set salary range if provided (using business method)
      if (jobData.salaryMin && jobData.salaryMax) {
        console.log('Setting salary, canBeEdited:', jobPosting.canBeEdited());
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
