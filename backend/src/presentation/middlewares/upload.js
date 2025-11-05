const multer = require('multer');
const path = require('path');

// Configure memory storage for multer
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types by field
  const allowedTypes = {
    avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    resume: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ],
  };

  // Get allowed types for this field, default to all document types
  const fieldAllowedTypes =
    allowedTypes[file.fieldname] || allowedTypes.document;

  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Định dạng file không được hỗ trợ cho ${
          file.fieldname
        }. Các định dạng được phép: ${fieldAllowedTypes.join(', ')}`
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
  },
});

// Specific upload configurations
const uploadAvatar = upload.single('avatar');
const uploadResume = upload.single('resume');
const uploadDocument = upload.single('document');
const uploadMultiple = upload.array('files', 5);

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Giới hạn tối đa là 10MB',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Quá nhiều file. Tối đa 5 files',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Trường file không được phép',
      });
    }
  }

  if (error.message.includes('Định dạng file không được hỗ trợ')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

module.exports = {
  upload,
  uploadAvatar,
  uploadResume,
  uploadDocument,
  uploadMultiple,
  handleMulterError,
};
