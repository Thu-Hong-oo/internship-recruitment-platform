const { logger } = require('../../../shared/utils/logger');

class SetDefaultCVUseCase {
  constructor(candidateRepository, cvRepository) {
    this.candidateRepository = candidateRepository;
    this.cvRepository = cvRepository;
  }

  async execute({ candidateId, cvId }) {
    try {
      // Verify candidate exists
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      // Find CV
      const cv = await this.cvRepository.findById(cvId);
      if (!cv) {
        throw new Error('CV_NOT_FOUND');
      }

      // Verify CV belongs to candidate
      if (cv.candidateId.toString() !== candidateId.toString()) {
        throw new Error('CV_ACCESS_DENIED');
      }

      // Use repository's setAsDefault method which handles both operations
      const updatedCV = await this.cvRepository.setAsDefault(cvId, candidateId);

      if (!updatedCV) {
        throw new Error('SET_DEFAULT_FAILED');
      }

      logger.info(`CV set as default: ${cvId} for candidate: ${candidateId}`);

      return {
        success: true,
        message: 'CV set as default successfully',
        cv: updatedCV,
      };
    } catch (error) {
      logger.error('Set default CV failed:', {
        error: error.message,
        candidateId,
        cvId,
      });
      throw error;
    }
  }
}

module.exports = SetDefaultCVUseCase;
