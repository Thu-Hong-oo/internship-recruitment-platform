const { cloudinary } = require('./cloudinaryService');

/**
 * Upload an image to Cloudinary with sane defaults per type
 * @param {('avatar'|'logo'|'image')} type
 * @param {string} filePath
 * @param {object} options
 * @returns {Promise<{ publicId: string, url: string, bytes: number, format: string, width: number, height: number }>}
 */
async function uploadImage(type, filePathOrBuffer, options = {}) {
  const configByType = {
    avatar: {
      folder: 'internbridge/avatars',
      transformation: [
        { width: 800, height: 800, crop: 'fill', gravity: 'face' },
        { quality: 85, fetch_format: 'auto' },
      ],
    },
    logo: {
      folder: 'internbridge/logos',
      transformation: [
        { width: 1200, height: 600, crop: 'limit' },
        { quality: 90, fetch_format: 'auto' },
      ],
    },
    image: {
      folder: options.folder || 'internbridge',
      transformation: [
        {
          width: options.optimization?.maxWidth || 1920,
          height: options.optimization?.maxHeight || 1080,
          crop: 'limit',
        },
        { quality: options.optimization?.quality || 80, fetch_format: 'auto' },
      ],
    },
  };

  const config = configByType[type] || configByType.image;

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

module.exports = { uploadImage };
