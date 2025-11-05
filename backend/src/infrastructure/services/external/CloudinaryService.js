const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

class CloudinaryService {
  constructor() {
    this.initialize();
  }

  initialize() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(fileBuffer, folder = 'smart-recruitment', options = {}) {
    try {
      const result = await cloudinary.uploader.upload(
        `data:${fileBuffer.mimetype};base64,${fileBuffer.buffer.toString(
          'base64'
        )}`,
        {
          folder,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          ...options,
        }
      );
      return result;
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  async uploadFromPath(filePath, folder = 'smart-recruitment', options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
      });
      return result;
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  async deleteMultipleFiles(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result.deleted;
    } catch (error) {
      throw new Error(`Cloudinary bulk delete failed: ${error.message}`);
    }
  }

  getFileUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }

  generateDownloadUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      secure: true,
      flags: 'attachment',
      ...options,
    });
  }

  generatePreviewUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      secure: true,
      width: 300,
      height: 400,
      crop: 'fit',
      quality: 'auto',
      ...options,
    });
  }

  generateThumbnailUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      secure: true,
      width: 150,
      height: 200,
      crop: 'thumb',
      quality: 'auto',
      ...options,
    });
  }

  validateFile(file) {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        'Invalid file type. Only PDF, images, and Word documents are allowed.'
      );
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    return true;
  }

  getStorage(folder = 'smart-recruitment') {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
      },
    });
  }

  getUploadMiddleware(folder = 'smart-recruitment', options = {}) {
    const storage = this.getStorage(folder);
    return multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: options.maxFiles || 1,
      },
      fileFilter: (req, file, cb) => {
        try {
          this.validateFile(file);
          cb(null, true);
        } catch (error) {
          cb(error, false);
        }
      },
    });
  }

  async getResourceInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      throw new Error(`Failed to get resource info: ${error.message}`);
    }
  }

  async getResourcesByFolder(folder, options = {}) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: options.limit || 50,
        ...options,
      });
      return result.resources;
    } catch (error) {
      throw new Error(`Failed to get resources: ${error.message}`);
    }
  }

  async createFolder(folderName) {
    try {
      // Cloudinary doesn't have explicit folder creation
      // Folders are created automatically when files are uploaded
      return { success: true, folder: folderName };
    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  async getUsageStats() {
    try {
      const result = await cloudinary.api.usage();
      return result;
    } catch (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }
  }

  async transformImage(publicId, transformations) {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations,
    });
  }

  async generateSignedUploadUrl(folder = 'smart-recruitment', options = {}) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder,
          ...options,
        },
        process.env.CLOUDINARY_API_SECRET
      );

      return {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      };
    } catch (error) {
      throw new Error(`Failed to generate signed upload URL: ${error.message}`);
    }
  }
}

module.exports = new CloudinaryService();
