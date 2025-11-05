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

      // Remove default flag from all CVs of this candidate
      await this.cvRepository.updateMany({ candidateId }, { isDefault: false });

      // Set this CV as default
      const updatedCV = await this.cvRepository.updateCV(cvId, {
        isDefault: true,
      });

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
