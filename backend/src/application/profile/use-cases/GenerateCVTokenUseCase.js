const jwt = require('jsonwebtoken');
const { logger } = require('../../../shared/utils/logger');

/**
 * GenerateCVTokenUseCase
 * Generate temporary token for CV viewing without authentication
 */
class GenerateCVTokenUseCase {
  constructor(cvRepository) {
    this.cvRepository = cvRepository;
  }

  async execute({ cvId, candidateId }) {
    try {
      // Verify CV exists and belongs to candidate
      const cv = await this.cvRepository.findById(cvId);

      if (!cv) {
        throw new Error('CV không tồn tại');
      }

      if (cv.candidateId.toString() !== candidateId.toString()) {
        throw new Error('Không có quyền truy cập CV này');
      }

      if (!cv.isActive) {
        throw new Error('CV đã bị xóa');
      }

      // Generate temporary token (valid for 1 hour)
      const token = jwt.sign(
        {
          cvId: cv._id,
          candidateId: cv.candidateId,
          type: 'cv_view',
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      logger.info('CV view token generated', {
        cvId,
        candidateId,
      });

      return {
        success: true,
        token,
        viewUrl: `/api/public/cv/view/${token}`,
        downloadUrl: `/api/public/cv/view/${token}?mode=download`,
      };
    } catch (error) {
      logger.error('Generate CV token failed:', {
        error: error.message,
        cvId,
        candidateId,
      });
      throw error;
    }
  }
}

module.exports = GenerateCVTokenUseCase;
