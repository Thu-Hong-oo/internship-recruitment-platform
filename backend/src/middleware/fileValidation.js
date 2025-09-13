const { logger } = require('../utils/logger');
const { UPLOAD } = require('../constants/common.constants');

// Enhanced file validation middleware
const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = UPLOAD.ALLOWED_IMAGE_TYPES,
    maxSize = UPLOAD.MAX_FILE_SIZE,
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    checkMagicNumbers = true,
  } = options;

  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file nào được upload',
      });
    }

    const file = req.file;
    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(
        `File quá lớn. Kích thước tối đa là ${Math.round(
          maxSize / 1024 / 1024
        )}MB`
      );
    }

    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(
        `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`
      );
    }

    // Check file extension
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(
        `Phần mở rộng file không hợp lệ. Chỉ chấp nhận: ${allowedExtensions.join(
          ', '
        )}`
      );
    }

    // Check magic numbers for additional security
    if (checkMagicNumbers && file.buffer) {
      const magicNumbers = {
        'image/jpeg': [0xff, 0xd8, 0xff],
        'image/png': [0x89, 0x50, 0x4e, 0x47],
        'image/gif': [0x47, 0x49, 0x46],
        'image/webp': [0x52, 0x49, 0x46, 0x46],
      };

      const expectedMagic = magicNumbers[file.mimetype];
      if (expectedMagic) {
        const isValidMagic = expectedMagic.every(
          (byte, index) => file.buffer[index] === byte
        );

        if (!isValidMagic) {
          errors.push('File không hợp lệ hoặc bị hỏng');
        }
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
    ];

    const fileContent = file.buffer.toString(
      'utf8',
      0,
      Math.min(1024, file.buffer.length)
    );
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileContent)) {
        errors.push('File chứa nội dung không an toàn');
        break;
      }
    }

    if (errors.length > 0) {
      logger.warn('File upload validation failed', {
        userId: req.user?.id,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        errors,
      });

      return res.status(400).json({
        success: false,
        error: 'File không hợp lệ',
        details: errors,
      });
    }

    // Add file info to request for logging
    req.fileInfo = {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    logger.info('File upload validated successfully', {
      userId: req.user?.id,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    next();
  };
};

// Document validation middleware
const validateDocumentUpload = (options = {}) => {
  const {
    allowedTypes = UPLOAD.ALLOWED_DOCUMENT_TYPES,
    maxSize = UPLOAD.MAX_FILE_SIZE,
    allowedExtensions = ['.pdf', '.doc', '.docx'],
  } = options;

  return validateFileUpload({
    allowedTypes,
    maxSize,
    allowedExtensions,
    checkMagicNumbers: false, // Documents don't need magic number check
  });
};

module.exports = {
  validateFileUpload,
  validateDocumentUpload,
};
