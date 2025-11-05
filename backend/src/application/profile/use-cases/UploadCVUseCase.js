const { logger } = require('../../../shared/utils/logger');

class UploadCVUseCase {
  constructor(candidateRepository, cvRepository, uploadService) {
    this.candidateRepository = candidateRepository;
    this.cvRepository = cvRepository;
    this.uploadService = uploadService;
  }

  async execute({ candidateId, file }) {
    try {
      // Verify candidate exists
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      // Upload to cloud storage (UnifiedUploadService expects object)
      const uploadResult = await this.uploadService.uploadFile({
        file: file,
        type: 'resume',
        userId: candidateId,
      });

      // Check if candidate has any existing CVs
      const existingCVs = await this.cvRepository.findByCandidate(candidateId);
      const isFirstCV = existingCVs.length === 0;

      // Create CV record (using schema field names)
      const cvData = {
        candidateId,
        originalName: file.originalname,
        cloudinaryUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.public_id,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        isDefault: isFirstCV, // First CV is automatically set as default
      };

      const cv = await this.cvRepository.create(cvData);

      logger.info(
        `CV uploaded successfully for candidate: ${candidateId}, isDefault: ${isFirstCV}`
      );

      return {
        success: true,
        message: 'CV uploaded thành công',
        cv: cv.toClientJSON(), // Format for client with download/preview URLs
      };
    } catch (error) {
      logger.error('Upload CV failed:', {
        error: error.message,
        candidateId,
        fileName: file?.originalname,
      });
      throw error;
    }
  }
}

module.exports = UploadCVUseCase;
