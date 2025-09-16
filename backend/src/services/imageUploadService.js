const { cloudinary } = require('./cloudinaryService');

/**
 * Upload an image to Cloudinary with optimized settings per type
 * @param {('avatar'|'logo'|'cover'|'document')} type
 * @param {Buffer|string} filePathOrBuffer
 * @param {object} options
 * @returns {Promise<{ publicId: string, url: string, bytes: number, format: string, width: number, height: number }>}
 */
async function uploadImage(type, filePathOrBuffer, options = {}) {
  const configByType = {
    avatar: {
      folder: 'internbridge/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 85, fetch_format: 'auto' },
      ],
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
    logo: {
      folder: 'internbridge/logos',
      transformation: [
        { width: 800, height: 400, crop: 'limit' },
        { quality: 90, fetch_format: 'auto' },
      ],
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    },
    cover: {
      folder: 'internbridge/covers',
      transformation: [
        { width: 1200, height: 600, crop: 'fill', gravity: 'center' },
        { quality: 85, fetch_format: 'auto' },
      ],
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
    document: {
      folder: 'internbridge/documents',
      resource_type: 'auto',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
    },
  };

  const config = { ...configByType[type], ...options };

  // Support both disk path and buffer (from multer.memoryStorage)
  let result;
  if (Buffer.isBuffer(filePathOrBuffer)) {
    result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        config,
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
      uploadStream.end(filePathOrBuffer);
    });
  } else {
    result = await cloudinary.uploader.upload(filePathOrBuffer, config);
  }

  return {
    publicId: result.public_id,
    url: result.secure_url,
    bytes: result.bytes,
    format: result.format,
    width: result.width,
    height: result.height,
  };
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId
 * @returns {Promise<void>}
 */
async function deleteImage(publicId) {
  try {
    if (publicId && !publicId.includes('http')) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted image: ${publicId}`);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

module.exports = {
  uploadImage,
  deleteImage,
};
