const { logger } = require('../../../shared/utils/logger');

class CreateEmployerProfileUseCase {
  constructor(employerRepository, userRepository) {
    this.employerRepository = employerRepository;
    this.userRepository = userRepository;
  }

  async execute({ userId, profileData }) {
    try {
      // Check if user already has a profile
      const existingProfile = await this.employerRepository.findByUserId(
        userId
      );
      if (existingProfile) {
        throw new Error('PROFILE_ALREADY_EXISTS');
      }

      // Create new profile
      const profile = await this.employerRepository.create({
        userId,
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update user with employer profile reference
      await this.userRepository.updateEmployerProfile(userId, profile._id);

      logger.info(`Employer profile created for user: ${userId}`);

      return {
        message: 'Hồ sơ nhà tuyển dụng đã được tạo thành công',
        employer: profile,
      };
    } catch (error) {
      logger.error('Create employer profile failed:', error);
      throw error;
    }
  }
}

module.exports = CreateEmployerProfileUseCase;
