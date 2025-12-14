const { cloudinary } = require('../../utils/cloudinary');
const { logger } = require('../../utils/logger');

/**
 * Upload any file (image, video, document, audio, etc.) to Cloudinary
 * @param {('image'|'video'|'document'|'audio'|'other')} type
 * @param {Buffer|string} filePathOrBuffer
 * @param {object} options
 * @returns {Promise<{ publicId: string, url: string, bytes: number, format: string, width?: number, height?: number, duration?: number }>}
 */
async function uploadFile(type, filePathOrBuffer, options = {}) {
  const configByType = {
    image: {
      folder: 'internbridge/images',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
      transformation: [{ quality: 85, fetch_format: 'auto' }],
    },
    video: {
      folder: 'internbridge/videos',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      transformation: [{ quality: 'auto' }],
    },
    document: {
      folder: 'internbridge/documents',
      resource_type: 'raw',
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
    },
    audio: {
      folder: 'internbridge/audios',
      resource_type: 'video', // Cloudinary treats audio as video
      allowed_formats: ['mp3', 'wav', 'ogg', 'aac'],
    },
    other: {
      folder: 'internbridge/files',
      resource_type: 'auto',
      allowed_formats: [], // allow all
    },
  };

  const config = { ...configByType[type], ...options };

  // Debug logging
  logger.debug(`📤 FileUploadService: Uploading ${type} file`);
  logger.debug('Config:', { config });

  // Giới hạn kích thước file mặc định theo loại
  const defaultMaxSizeByType = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 20 * 1024 * 1024, // 20MB
    other: 10 * 1024 * 1024, // 10MB
  };
  const maxSize =
    options.maxSize || defaultMaxSizeByType[type] || 10 * 1024 * 1024;
  let fileSize;
  if (Buffer.isBuffer(filePathOrBuffer)) {
    fileSize = filePathOrBuffer.length;
  } else if (typeof filePathOrBuffer === 'string') {
    try {
      const fs = require('fs');
      fileSize = fs.statSync(filePathOrBuffer).size;
    } catch (err) {
      fileSize = undefined;
    }
  }
  if (fileSize !== undefined && fileSize > maxSize) {
    throw new Error(
      'File vượt quá giới hạn kích thước cho phép (' +
        maxSize / (1024 * 1024) +
        'MB)'
    );
  }

  let result;
  if (Buffer.isBuffer(filePathOrBuffer)) {
    logger.debug('📤 Uploading from buffer...');
    result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        config,
        (err, res) => {
          if (err) {
            logger.error('❌ Upload stream error:', err);
            return reject(err);
          }
          logger.info('✅ Upload stream success:', {
            public_id: res.public_id,
            url: res.secure_url,
            format: res.format,
            bytes: res.bytes,
          });
          resolve(res);
        }
      );
      uploadStream.end(filePathOrBuffer);
    });
  } else {
    logger.debug('📤 Uploading from file path...');
    result = await cloudinary.uploader.upload(filePathOrBuffer, config);
  }

  return {
    publicId: result.public_id,
    url: result.secure_url,
    bytes: result.bytes,
    format: result.format,
    width: result.width,
    height: result.height,
    duration: result.duration,
  };
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId
 * @param {('image'|'video'|'raw'|'auto')} resourceType
 * @returns {Promise<void>}
 */
async function deleteFile(publicId, resourceType = 'auto') {
  try {
    if (publicId && !publicId.includes('http')) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      logger.info(`Deleted file: ${publicId}`);
    }
  } catch (error) {
    logger.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
}

module.exports = {
  uploadFile,
  deleteFile,
};
