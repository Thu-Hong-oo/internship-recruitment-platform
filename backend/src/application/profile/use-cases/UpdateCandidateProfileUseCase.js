const { logger } = require('../../../shared/utils/logger');

class UpdateCandidateProfileUseCase {
  constructor(candidateRepository) {
    this.candidateRepository = candidateRepository;
  }

  async execute({ userId, candidateId, profileData }) {
    try {
      let candidate;

      if (candidateId) {
        candidate = await this.candidateRepository.findById(candidateId);
      } else if (userId) {
        candidate = await this.candidateRepository.findByUserId(userId);
      } else {
        throw new Error('MISSING_REQUIRED_PARAMETER');
      }

      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      const updatedCandidate = await this.candidateRepository.update(
        candidate._id,
        profileData
      );

      const logId = candidateId || `user:${userId}`;
      logger.info(`Candidate profile updated: ${logId}`);

      return {
        message: 'Hồ sơ ứng viên đã được cập nhật thành công',
        candidate: updatedCandidate,
      };
    } catch (error) {
      logger.error('Update candidate profile failed:', error);
      throw error;
    }
  }
}

module.exports = UpdateCandidateProfileUseCase;
