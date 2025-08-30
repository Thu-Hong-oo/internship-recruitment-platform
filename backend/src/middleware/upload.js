const multer = require('multer');
const { storage } = require('../services/cloudinaryService');
const { logger } = require('../utils/logger');

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh (jpg, jpeg, png, gif, webp)'), false);
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (Cloudinary supports larger files)
  }
});

// Middleware for single avatar upload
const uploadAvatar = upload.single('avatar');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File quá lớn. Kích thước tối đa là 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Lỗi upload file: ' + error.message
    });
  }

  if (error.message && error.message.includes('Chỉ chấp nhận file hình ảnh')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  logger.error('Upload error:', { error: error.message });
  next(error);
};

module.exports = {
  uploadAvatar,
  handleUploadError
};
