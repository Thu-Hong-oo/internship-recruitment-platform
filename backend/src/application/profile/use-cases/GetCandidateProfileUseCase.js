const { logger } = require('../../../shared/utils/logger');

class GetCandidateProfileUseCase {
  constructor(candidateRepository) {
    this.candidateRepository = candidateRepository;
  }

  async execute({ candidateId }) {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);

      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      logger.info(`Candidate profile retrieved: ${candidateId}`);

      return {
        candidate,
      };
    } catch (error) {
      logger.error('Get candidate profile failed:', error);
      throw error;
    }
  }
}

module.exports = GetCandidateProfileUseCase;
