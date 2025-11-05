const { logger } = require('../../../shared/utils/logger');

class GetEmployerProfileUseCase {
  constructor(employerRepository) {
    this.employerRepository = employerRepository;
  }

  async execute({ employerId }) {
    try {
      const employer = await this.employerRepository.findById(employerId);

      if (!employer) {
        throw new Error('EMPLOYER_NOT_FOUND');
      }

      logger.info(`Employer profile retrieved: ${employerId}`);

      return {
        employer,
      };
    } catch (error) {
      logger.error('Get employer profile failed:', error);
      throw error;
    }
  }
}

module.exports = GetEmployerProfileUseCase;
