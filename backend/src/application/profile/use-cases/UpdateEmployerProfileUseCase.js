const { logger } = require('../../../shared/utils/logger');

class UpdateEmployerProfileUseCase {
  constructor(employerRepository) {
    this.employerRepository = employerRepository;
  }

  async execute({ employerId, profileData }) {
    try {
      const employer = await this.employerRepository.findById(employerId);

      if (!employer) {
        throw new Error('EMPLOYER_NOT_FOUND');
      }

      const updatedEmployer = await this.employerRepository.update(
        employerId,
        profileData
      );

      logger.info(`Employer profile updated: ${employerId}`);

      return {
        message: 'Hồ sơ nhà tuyển dụng đã được cập nhật thành công',
        employer: updatedEmployer,
      };
    } catch (error) {
      logger.error('Update employer profile failed:', error);
      throw error;
    }
  }
}

module.exports = UpdateEmployerProfileUseCase;
