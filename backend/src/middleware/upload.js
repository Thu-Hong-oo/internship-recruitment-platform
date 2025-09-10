const multer = require('multer');
const { logger } = require('../utils/logger');

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(
      new Error('Chỉ chấp nhận file hình ảnh (jpg, jpeg, png, gif, webp)'),
      false
    );
  }
};

// Configure multer with in-memory storage (let service upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (Cloudinary supports larger files)
  },
});

// Middleware for single avatar upload
const uploadAvatar = upload.single('avatar');
// Middleware for generic single image (field: image)
const uploadImage = upload.single('image');
// Middleware for multiple images (field: images)
const uploadImages = upload.array('images');
// Middleware for company logo (field: logo)
const uploadLogo = upload.single('logo');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File quá lớn. Kích thước tối đa là 10MB',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Lỗi upload file: ' + error.message,
    });
  }

  if (error.message && error.message.includes('Chỉ chấp nhận file hình ảnh')) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  logger.error('Upload error:', { error: error.message });
  next(error);
};

module.exports = {
  uploadAvatar,
  uploadImage,
  uploadImages,
  uploadLogo,
  handleUploadError,
};
