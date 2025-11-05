const { logger } = require('../../../shared/utils/logger');

class GetCandidateCVsUseCase {
  constructor(cvRepository) {
    this.cvRepository = cvRepository;
  }

  async execute({ candidateId }) {
    try {
      if (!candidateId) {
        throw new Error('MISSING_CANDIDATE_ID');
      }

      const cvs = await this.cvRepository.findByCandidate(candidateId);

      logger.info(`Retrieved ${cvs.length} CVs for candidate: ${candidateId}`);

      return {
        cvs,
        total: cvs.length,
      };
    } catch (error) {
      logger.error('Get candidate CVs failed:', {
        error: error.message,
        candidateId,
      });
      throw error;
    }
  }
}

module.exports = GetCandidateCVsUseCase;
