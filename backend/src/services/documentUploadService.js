const cloudinary = require('cloudinary').v2;
const { logger } = require('../utils/logger');

/**
 * Service for handling document uploads to Cloudinary
 * Supports both PDF and image files for business documents
 */
class DocumentUploadService {
  /**
   * Upload a document file to Cloudinary
   * @param {Object} file - Multer file object
   * @param {string} userId - User ID for folder organization
   * @param {string} documentType - Type of document (business-license, tax-certificate, etc.)
   * @returns {Promise<Object>} Upload result with URL and metadata
   */
  async uploadDocument(file, userId, documentType) {
    try {
      if (!file) {
        throw new Error('No file provided for upload');
      }

      // Validate file type
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(
          'Invalid file type. Only PDF and image files are allowed.'
        );
      }

      // Validate file size (20MB max)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 20MB.');
      }

      // Upload to Cloudinary from buffer (memory storage)
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `employers/${userId}/documents`,
              resource_type: 'auto', // Supports both images and PDFs
              public_id: `${documentType}_${Date.now()}`,
              // Add transformation for PDFs to ensure proper handling
              format: file.mimetype === 'application/pdf' ? 'pdf' : undefined,
              pages: file.mimetype === 'application/pdf' ? true : undefined,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(file.buffer);
      });

      logger.info('Document uploaded successfully to Cloudinary', {
        userId,
        documentType,
        cloudinaryId: uploadResult.public_id,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };
    } catch (error) {
      logger.error('Document upload failed:', {
        error: error.message,
        userId,
        documentType,
        originalName: file?.originalname,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Delete a document from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDocument(publicId) {
    try {
      if (!publicId) {
        throw new Error('No public ID provided for deletion');
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'auto', // Handle both images and PDFs
      });

      logger.info('Document deleted from Cloudinary', {
        publicId,
        result: result.result,
      });

      return {
        success: true,
        result: result.result,
        publicId,
      };
    } catch (error) {
      logger.error('Document deletion failed:', {
        error: error.message,
        publicId,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Get document metadata from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Document metadata
   */
  async getDocumentMetadata(publicId) {
    try {
      if (!publicId) {
        throw new Error('No public ID provided');
      }

      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'auto',
      });

      return {
        success: true,
        metadata: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          createdAt: result.created_at,
          resourceType: result.resource_type,
        },
      };
    } catch (error) {
      logger.error('Failed to get document metadata:', {
        error: error.message,
        publicId,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Validate document file before upload
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  validateDocumentFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file type
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only PDF and image files are allowed.');
    }

    // Check file size (20MB max)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      errors.push('File size too large. Maximum size is 20MB.');
    }

    // Check filename
    if (!file.originalname || file.originalname.trim() === '') {
      errors.push('Invalid filename');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
module.exports = new DocumentUploadService();
