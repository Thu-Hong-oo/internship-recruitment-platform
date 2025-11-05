const { logger } = require('../../../shared/utils/logger');
const JobPostingMapper = require('../../../infrastructure/mappers/JobPostingMapper');

/**
 * Use case for updating a job post
 * Uses JobPosting Domain Entity with business rules
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

      // Get existing job as domain entity
      const jobPosting = await this.jobRepository.findById(jobId);
      if (!jobPosting) {
        throw new Error('JOB_NOT_FOUND');
      }

      // Check authorization
      if (jobPosting.employerId.toString() !== employerId) {
        throw new Error('UNAUTHORIZED');
      }

      // Check if job can be edited (business rule from domain entity)
      if (!jobPosting.canBeEdited()) {
        throw new Error(
          'JOB_CANNOT_BE_EDITED: Job is closed and cannot be modified'
        );
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

      // Apply business logic through domain entity
      if (updateData.salaryMin || updateData.salaryMax) {
        jobPosting.setSalaryRange(
          updateData.salaryMin || jobPosting.salaryMin,
          updateData.salaryMax || jobPosting.salaryMax,
          updateData.salaryCurrency || jobPosting.salaryCurrency
        );
      }

      // Update other properties
      if (updateData.title) jobPosting.title = updateData.title;
      if (updateData.description)
        jobPosting.description = updateData.description;
      if (updateData.location) jobPosting.location = updateData.location;
      if (updateData.jobType) jobPosting.jobType = updateData.jobType;
      if (updateData.experience) jobPosting.experience = updateData.experience;
      if (updateData.education) jobPosting.education = updateData.education;
      if (updateData.benefits) jobPosting.benefits = updateData.benefits;
      if (updateData.deadline)
        jobPosting.deadline = new Date(updateData.deadline);
      if (updateData.numberOfPositions)
        jobPosting.numberOfPositions = updateData.numberOfPositions;

      // Handle requirements array
      if (updateData.requirements) {
        jobPosting.requirements = [];
        updateData.requirements.forEach(req => jobPosting.addRequirement(req));
      }

      // Handle skills array
      if (updateData.skills) {
        jobPosting.skills = [];
        updateData.skills.forEach(skill => jobPosting.addSkill(skill));
      }

      // Save through repository
      const updatedJob = await this.jobRepository.updateById(
        jobId,
        JobPostingMapper.toMongoose(jobPosting)
      );
      if (!updatedJob) {
        throw new Error('JOB_UPDATE_FAILED');
      }

      logger.info('Job updated successfully', { jobId });

      return {
        success: true,
        job: updatedJob, // Domain entity
        message: 'Job updated successfully',
      };
    } catch (error) {
      logger.error('Update job error:', error);
      throw error;
    }
  }
}

module.exports = UpdateJobUseCase;
