const { logger } = require('../../../shared/utils/logger');

class UploadAvatarUseCase {
  constructor(userRepository, candidateRepository, uploadService) {
    this.userRepository = userRepository;
    this.candidateRepository = candidateRepository;
    this.uploadService = uploadService;
  }

  async execute({ userId, file, userRole }) {
    try {
      if (!file) {
        throw new Error('FILE_REQUIRED');
      }

      // Upload to cloud storage (UnifiedUploadService expects object)
      const uploadResult = await this.uploadService.uploadFile({
        file: file,
        type: 'avatar',
        userId: userId,
      });

      // Update User model with new avatar URL
      const updatedUser = await this.userRepository.updateUser(userId, {
        avatarUrl: uploadResult.url,
      });

      if (!updatedUser) {
        throw new Error('USER_NOT_FOUND');
      }

      // Get updated profile based on role
      let profile = null;
      if (userRole === 'candidate') {
        profile = await this.candidateRepository.findByUserId(userId);
      } else if (userRole === 'employer') {
        const {
          EmployerRepository,
        } = require('../../../infrastructure/repositories/EmployerRepository');
        const employerRepo = new EmployerRepository();
        profile = await employerRepo.findByUserId(userId);
      }

      logger.info(
        `Avatar uploaded successfully for user: ${userId}, role: ${userRole}`
      );

      return {
        success: true,
        message: 'Upload avatar thành công',
        user: updatedUser,
        profile,
      };
    } catch (error) {
      logger.error('Upload avatar failed:', {
        error: error.message,
        userId,
        userRole,
        fileName: file?.originalname,
      });
      throw error;
    }
  }
}

module.exports = UploadAvatarUseCase;
