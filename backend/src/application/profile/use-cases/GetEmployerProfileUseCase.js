const { logger } = require('../../../shared/utils/logger');

class GetEmployerProfileUseCase {
  constructor(employerRepository) {
    this.employerRepository = employerRepository;
  }

  async execute({ employerId, userId }) {
    try {
      let employer;

      // Try to find by employerId first
      if (employerId) {
        employer = await this.employerRepository.findById(employerId);
      }

      // If not found and userId provided, try to find by userId
      if (!employer && userId) {
        employer = await this.employerRepository.findByUserId(userId);
      }

      // If profile not found, return a flag indicating profile needs to be created
      if (!employer) {
        logger.info(
          `Employer profile not found for user: ${userId}. Profile creation required.`
        );
        return {
          employer: null,
          requiresProfileCreation: true,
        };
      }

      logger.info(`Employer profile retrieved: ${employer._id}`);

      return {
        employer,
        requiresProfileCreation: false,
      };
    } catch (error) {
      logger.error('Get employer profile failed:', error);
      throw error;
    }
  }
}

module.exports = GetEmployerProfileUseCase;
