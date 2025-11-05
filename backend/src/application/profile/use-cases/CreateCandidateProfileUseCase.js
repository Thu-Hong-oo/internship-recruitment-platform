const { logger } = require('../../../shared/utils/logger');

class CreateCandidateProfileUseCase {
  constructor(candidateRepository, userRepository) {
    this.candidateRepository = candidateRepository;
    this.userRepository = userRepository;
  }

  async execute({ userId, profileData }) {
    try {
      // Check if user already has a profile
      const existingProfile = await this.candidateRepository.findByUserId(
        userId
      );
      if (existingProfile) {
        throw new Error('PROFILE_ALREADY_EXISTS');
      }

      // Create new profile
      const profile = await this.candidateRepository.create({
        userId,
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update user with candidate profile reference
      await this.userRepository.updateCandidateProfile(userId, profile._id);

      logger.info(`Candidate profile created for user: ${userId}`);

      return {
        message: 'Hồ sơ ứng viên đã được tạo thành công',
        candidate: profile,
      };
    } catch (error) {
      logger.error('Create candidate profile failed:', error);
      throw error;
    }
  }
}

module.exports = CreateCandidateProfileUseCase;
