const { logger } = require('../../../shared/utils/logger');

class UpdateCandidateProfileUseCase {
  constructor(candidateRepository) {
    this.candidateRepository = candidateRepository;
  }

  async execute({ candidateId, profileData }) {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);

      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      const updatedCandidate = await this.candidateRepository.update(
        candidateId,
        profileData
      );

      logger.info(`Candidate profile updated: ${candidateId}`);

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
