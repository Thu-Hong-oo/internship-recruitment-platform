const { logger } = require('../../../shared/utils/logger');

class DeleteCVUseCase {
  constructor(candidateRepository, cvRepository, uploadService) {
    this.candidateRepository = candidateRepository;
    this.cvRepository = cvRepository;
    this.uploadService = uploadService;
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

      // Delete from cloud storage
      if (cv.cloudinaryPublicId) {
        await this.uploadService.deleteFile(cv.cloudinaryPublicId);
      }

      // Delete CV record (soft delete)
      await this.cvRepository.delete(cvId);

      logger.info(
        `CV deleted successfully: ${cvId} for candidate: ${candidateId}`
      );

      return {
        success: true,
        message: 'CV deleted successfully',
      };
    } catch (error) {
      logger.error('Delete CV failed:', {
        error: error.message,
        candidateId,
        cvId,
      });
      throw error;
    }
  }
}

module.exports = DeleteCVUseCase;
