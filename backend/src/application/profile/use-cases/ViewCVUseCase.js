const { logger } = require('../../../shared/utils/logger');
const axios = require('axios');

/**
 * ViewCVUseCase
 * Returns CV file stream for viewing/downloading
 */
class ViewCVUseCase {
  constructor(cvRepository) {
    this.cvRepository = cvRepository;
  }

  async execute({ cvId, candidateId, mode = 'view' }) {
    try {
      // Find CV
      const cv = await this.cvRepository.findById(cvId);

      if (!cv) {
        throw new Error('CV không tồn tại');
      }

      // Check ownership
      if (cv.candidateId.toString() !== candidateId.toString()) {
        throw new Error('Không có quyền truy cập CV này');
      }

      // Check if CV is active
      if (!cv.isActive) {
        throw new Error('CV đã bị xóa');
      }

      // Construct proper Cloudinary URL for raw files
      let fileUrl;

      if (cv.cloudinaryPublicId) {
        // Use public_id to construct URL with proper format
        const cloudName = 'du10thaqs';
        const resourceType = 'raw'; // For non-image files (PDF, DOC, etc.)

        if (mode === 'download') {
          // Force download
          fileUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/fl_attachment/${cv.cloudinaryPublicId}`;
        } else {
          // View inline in browser
          fileUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cv.cloudinaryPublicId}`;
        }
      } else {
        // Fallback to stored URL
        fileUrl = cv.cloudinaryUrl;
        if (mode === 'download' && fileUrl) {
          fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
        }
      }

      logger.info('CV URL generated', {
        cvId,
        publicId: cv.cloudinaryPublicId,
        originalUrl: cv.cloudinaryUrl,
        generatedUrl: fileUrl,
        mode,
      });

      logger.info('CV view requested', {
        cvId,
        candidateId,
        mode,
        fileUrl,
      });

      return {
        success: true,
        cv: {
          id: cv._id,
          fileName: cv.originalName,
          fileUrl,
          mimeType: cv.mimeType,
          fileSize: cv.fileSize,
          isDefault: cv.isDefault,
        },
      };
    } catch (error) {
      logger.error('View CV failed:', {
        error: error.message,
        cvId,
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Proxy CV file through backend (fetch from Cloudinary and stream to client)
   * Use this method to serve file with proper headers for PDF viewing
   */
  async proxyFile({ cvId, candidateId, mode = 'view' }) {
    try {
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

      // Construct proper Cloudinary URL
      let accessibleUrl;
      if (cv.cloudinaryPublicId) {
        const cloudName = 'du10thaqs';
        accessibleUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${cv.cloudinaryPublicId}`;
      } else {
        // Fallback: fix URL format if needed
        accessibleUrl = cv.cloudinaryUrl.replace('http://', 'https://');
        if (accessibleUrl.includes('/image/upload/')) {
          accessibleUrl = accessibleUrl.replace(
            '/image/upload/',
            '/raw/upload/'
          );
        }
      }

      logger.info('Fetching CV from Cloudinary', {
        cvId,
        url: accessibleUrl,
      });

      // Fetch file from Cloudinary using native fetch
      const response = await fetch(accessibleUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch CV from Cloudinary: ${response.status} ${response.statusText}`
        );
      }

      // Get file buffer
      const fileBuffer = Buffer.from(await response.arrayBuffer());

      return {
        buffer: fileBuffer,
        fileName: cv.originalName || 'resume.pdf',
        mimeType: cv.mimeType || 'application/pdf',
        fileSize: cv.fileSize,
        mode,
      };
    } catch (error) {
      logger.error('Proxy CV file failed:', {
        error: error.message,
        cvId,
        candidateId,
      });
      throw error;
    }
  }
}

module.exports = ViewCVUseCase;
