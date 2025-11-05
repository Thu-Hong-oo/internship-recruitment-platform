const { cloudinary } = require('../../../../shared/utils/cloudinary');
const { logger } = require('../../../../shared/utils/logger');

/**
 * Unified Upload Service - Handles all file uploads to Cloudinary
 * Replaces: documentUploadService, imageUploadService, fileUploadService
 */
class UnifiedUploadService {
  constructor() {
    // Predefined upload configurations
    this.configs = {
      avatar: {
        folder: 'internbridge/avatars',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_size: 5 * 1024 * 1024, // 5MB
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 85, fetch_format: 'auto' },
        ],
      },
      logo: {
        folder: 'internbridge/logos',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        max_size: 5 * 1024 * 1024, // 5MB
        transformation: [
          { width: 800, height: 400, crop: 'limit' },
          { quality: 90, fetch_format: 'auto' },
        ],
      },
      cover: {
        folder: 'internbridge/covers',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_size: 10 * 1024 * 1024, // 10MB
        transformation: [
          { width: 1200, height: 600, crop: 'fill', gravity: 'center' },
          { quality: 85, fetch_format: 'auto' },
        ],
      },
      resume: {
        folder: 'internbridge/resumes',
        resource_type: 'raw', // Use 'raw' for non-image files (PDF, DOC, etc.)
        type: 'upload', // Public access for CV viewing
        access_mode: 'public', // Explicitly set public access
        allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        max_size: 10 * 1024 * 1024, // 10MB
      },
      document: {
        folder: 'internbridge/documents',
        resource_type: 'auto',
        allowed_formats: [
          'pdf',
          'doc',
          'docx',
          'ppt',
          'pptx',
          'xls',
          'xlsx',
          'jpg',
          'jpeg',
          'png',
          'html',
          'htm',
        ],
        max_size: 20 * 1024 * 1024, // 20MB
      },
      employer_document: {
        folder: 'internbridge/employers/documents',
        resource_type: 'auto',
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
        max_size: 20 * 1024 * 1024, // 20MB
      },
      video: {
        folder: 'internbridge/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        max_size: 50 * 1024 * 1024, // 50MB
        transformation: [{ quality: 'auto' }],
      },
      audio: {
        folder: 'internbridge/audios',
        resource_type: 'video', // Cloudinary treats audio as video
        allowed_formats: ['mp3', 'wav', 'ogg', 'aac'],
        max_size: 20 * 1024 * 1024, // 20MB
      },
    };
  }

  /**
   * Upload file to Cloudinary with unified configuration
   * @param {Object} options - Upload options
   * @param {Object} options.file - Multer file object or file buffer
   * @param {string} options.type - Upload type (avatar, resume, document, etc.)
   * @param {string} [options.userId] - User ID for dynamic folder paths
   * @param {string} [options.customFolder] - Custom folder override
   * @param {string} [options.publicId] - Custom public ID
   * @param {Object} [options.metadata] - Additional metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile({
    file,
    type,
    userId,
    customFolder,
    publicId,
    metadata = {},
  }) {
    try {
      // Validate inputs
      if (!file) throw new Error('No file provided for upload');
      if (!type) throw new Error('Upload type is required');
      if (!this.configs[type])
        throw new Error(`Unsupported upload type: ${type}`);

      // Get configuration for this upload type
      const config = { ...this.configs[type] };

      // Validate file
      const validation = this.validateFile(file, config);
      if (!validation.valid) {
        throw new Error(
          `File validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Customize folder path if userId provided
      if (userId && !customFolder) {
        config.folder = `${config.folder}/${userId}`;
      }
      if (customFolder) {
        config.folder = customFolder;
      }

      // Set public ID if provided
      if (publicId) {
        config.public_id = publicId;
      } else if (type === 'employer_document' && metadata.documentType) {
        config.public_id = `${metadata.documentType}_${Date.now()}`;
      }

      // Additional options
      if (type === 'document' || type === 'resume') {
        config.format = file.mimetype === 'application/pdf' ? 'pdf' : undefined;
        config.pages = file.mimetype === 'application/pdf' ? true : undefined;
      }

      // Upload to Cloudinary
      const uploadResult = await this.performUpload(file, config);

      // Log success
      logger.info('File uploaded successfully', {
        type,
        userId,
        publicId: uploadResult.public_id,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });

      return {
        success: true,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        bytes: uploadResult.bytes,
        uploadedAt: new Date(),
        metadata,
      };
    } catch (error) {
      logger.error('File upload failed', {
        error: error.message,
        type,
        userId,
        originalName: file?.originalname,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Perform the actual upload to Cloudinary
   * @param {Object} file - File object
   * @param {Object} config - Cloudinary config
   * @returns {Promise<Object>} Cloudinary result
   */
  async performUpload(file, config) {
    // Add timeout to config
    const configWithTimeout = {
      ...config,
      timeout: 240000, // 4 minutes timeout
    };

    if (file.buffer) {
      // Upload from buffer (memory storage) with timeout
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Cloudinary upload timeout after 4 minutes'));
        }, 240000);

        const uploadStream = cloudinary.uploader.upload_stream(
          configWithTimeout,
          (error, result) => {
            clearTimeout(timeoutId);
            if (error) {
              logger.error('Cloudinary upload error', {
                error: error.message,
                file: file.originalname,
                size: file.size,
              });
              reject(error);
            } else {
              logger.info('Cloudinary upload success', {
                publicId: result.public_id,
                file: file.originalname,
                size: result.bytes,
              });
              resolve(result);
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    } else if (file.path) {
      // Upload from file path (disk storage) with timeout
      return Promise.race([
        cloudinary.uploader.upload(file.path, configWithTimeout),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error('Cloudinary upload timeout after 4 minutes')),
            240000
          )
        ),
      ]);
    } else {
      throw new Error('File must have either buffer or path property');
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} [resourceType] - Resource type (auto, image, video, raw)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(publicId, resourceType = 'auto') {
    try {
      if (!publicId) throw new Error('No public ID provided for deletion');
      if (publicId.includes('http'))
        return { success: true, message: 'External URL, no deletion needed' };

      // Auto-detect resource type based on file extension or folder
      let actualResourceType = resourceType;
      if (resourceType === 'auto') {
        if (
          publicId.includes('/resumes/') ||
          publicId.includes('/documents/')
        ) {
          actualResourceType = 'raw'; // PDF, DOC, etc.
        } else if (
          publicId.includes('/images/') ||
          publicId.includes('/avatars/') ||
          publicId.includes('/logos/')
        ) {
          actualResourceType = 'image';
        } else if (publicId.includes('/videos/')) {
          actualResourceType = 'video';
        } else {
          // Try to detect from file extension
          const extension = publicId.split('.').pop()?.toLowerCase();
          if (
            ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'].includes(extension)
          ) {
            actualResourceType = 'raw';
          } else if (
            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)
          ) {
            actualResourceType = 'image';
          } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
            actualResourceType = 'video';
          } else {
            actualResourceType = 'raw'; // Default fallback
          }
        }
      }

      console.log(
        `🗑️ Deleting file with resource_type: ${actualResourceType}, publicId: ${publicId}`
      );

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: actualResourceType,
      });

      logger.info('File deleted successfully', {
        publicId,
        resourceType: actualResourceType,
        result: result.result,
      });

      return {
        success: true,
        result: result.result,
        publicId,
      };
    } catch (error) {
      logger.error('File deletion failed', {
        error: error.message,
        publicId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get file metadata from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} [resourceType] - Resource type
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(publicId, resourceType = 'auto') {
    try {
      if (!publicId) throw new Error('No public ID provided');

      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return {
        success: true,
        metadata: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height,
          createdAt: result.created_at,
          resourceType: result.resource_type,
        },
      };
    } catch (error) {
      logger.error('Failed to get file metadata', {
        error: error.message,
        publicId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Validate file against configuration
   * @param {Object} file - File object
   * @param {Object} config - Upload configuration
   * @returns {Object} Validation result
   */
  validateFile(file, config) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file type
    if (config.allowed_formats && config.allowed_formats.length > 0) {
      const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
      const mimeTypeValid = this.isMimeTypeAllowed(
        file.mimetype,
        config.allowed_formats
      );
      const extensionValid =
        fileExtension && config.allowed_formats.includes(fileExtension);

      if (!mimeTypeValid && !extensionValid) {
        errors.push(
          `Invalid file type. Allowed formats: ${config.allowed_formats.join(
            ', '
          )}`
        );
      }
    }

    // Check file size
    if (config.max_size && file.size > config.max_size) {
      const maxSizeMB = (config.max_size / (1024 * 1024)).toFixed(1);
      errors.push(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    // Check filename
    if (!file.originalname?.trim()) {
      errors.push('Invalid filename');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if mime type is allowed based on format list
   * @param {string} mimeType - File mime type
   * @param {Array} allowedFormats - Allowed format extensions
   * @returns {boolean} Is mime type allowed
   */
  isMimeTypeAllowed(mimeType, allowedFormats) {
    const mimeTypeMap = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'image/svg+xml': ['svg'],
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['docx'],
      'application/vnd.ms-powerpoint': ['ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        ['pptx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        'xlsx',
      ],
      'video/mp4': ['mp4'],
      'video/quicktime': ['mov'],
      'video/x-msvideo': ['avi'],
      'video/x-matroska': ['mkv'],
      'video/webm': ['webm'],
      'audio/mpeg': ['mp3'],
      'audio/wav': ['wav'],
      'audio/ogg': ['ogg'],
      'audio/aac': ['aac'],
    };

    const extensions = mimeTypeMap[mimeType] || [];
    return extensions.some(ext => allowedFormats.includes(ext));
  }

  /**
   * Get available upload types
   * @returns {Array} Available upload types
   */
  getAvailableTypes() {
    return Object.keys(this.configs);
  }

  /**
   * Get configuration for a specific type
   * @param {string} type - Upload type
   * @returns {Object} Configuration object
   */
  getTypeConfig(type) {
    return this.configs[type] ? { ...this.configs[type] } : null;
  }

  /**
   * Generate signed URL for secure access to private files
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Additional options
   * @returns {string} Signed URL
   */
  generateSignedUrl(publicId, options = {}) {
    try {
      if (!publicId) {
        throw new Error('Public ID is required for signed URL generation');
      }

      const defaultOptions = {
        sign_url: true,
        resource_type: 'raw', // Use raw for documents/PDFs
        type: 'upload',
        secure: true, // Force HTTPS
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
      };

      console.log('🔐 Generating signed URL with options:', {
        publicId,
        ...finalOptions,
      });

      const signedUrl = cloudinary.url(publicId, finalOptions);

      logger.info('Generated signed URL', {
        publicId,
        expiresAt: finalOptions.expires_at,
        resourceType: finalOptions.resource_type,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL:', error);
      throw error;
    }
  }

  /**
   * Get accessible URL for file (signed if needed)
   * @param {string} publicId - Cloudinary public ID
   * @param {string} originalUrl - Original secure URL
   * @returns {Object} Object with multiple URL options
   */
  getAccessibleUrl(publicId, originalUrl) {
    try {
      // For PDF files, generate multiple signed URL options
      if (publicId.includes('resume') || originalUrl.includes('.pdf')) {
        return {
          signedUrlRaw: this.generateSignedUrl(publicId, {
            resource_type: 'raw',
          }),
          signedUrlImage: this.generateSignedUrl(publicId, {
            resource_type: 'image',
          }),
          signedUrlAuto: this.generateSignedUrl(publicId, {
            resource_type: 'auto',
          }),
          originalUrl: originalUrl,
        };
      }

      // For other files, use original URL
      return {
        originalUrl: originalUrl,
      };
    } catch (error) {
      logger.warn('Failed to generate signed URL, using original:', error);
      return {
        originalUrl: originalUrl,
      };
    }
  }
}

// Export singleton instance
module.exports = new UnifiedUploadService();
