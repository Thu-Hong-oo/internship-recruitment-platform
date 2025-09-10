const asyncHandler = require('express-async-handler');
const { cloudinary } = require('../services/cloudinaryService');
const { uploadImage } = require('../services/imageUploadService');
const { logger } = require('../utils/logger');
const Company = require('../models/Company');

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private
const uploadSingleImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'Không có file nào được upload' });
    }

    const options = {
      folder: req.body.folder || 'internbridge',
      optimization: {
        quality: parseInt(req.body.quality) || 80,
        maxWidth: parseInt(req.body.maxWidth) || 1920,
        maxHeight: parseInt(req.body.maxHeight) || 1080,
      },
    };

    const result = await uploadImage('image', req.file.buffer, options);

    logger.info('Single image upload successful', {
      userId: req.user?.id,
      originalName: req.file.originalname,
      size: req.file.size,
      publicId: result.publicId,
    });

    res.status(200).json({
      success: true,
      message: 'Upload ảnh thành công',
      data: {
        originalName: req.file.originalname,
        originalSize: req.file.size,
        publicId: result.publicId,
        url: result.url,
        size: result.bytes,
        format: result.format,
        dimensions: { width: result.width, height: result.height },
      },
    });
  } catch (error) {
    logger.error('Single image upload failed:', {
      error: error.message,
      userId: req.user?.id,
      fileName: req.file?.originalname,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Upload ảnh thất bại',
    });
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultipleImages = asyncHandler(async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Không có file nào được upload',
      });
    }

    const options = {
      folder: req.body.folder || 'internbridge',
      optimize: req.body.optimize !== 'false',
      createThumbnail: req.body.createThumbnail !== 'false',
      optimization: {
        quality: parseInt(req.body.quality) || 80,
        maxWidth: parseInt(req.body.maxWidth) || 1920,
        maxHeight: parseInt(req.body.maxHeight) || 1080,
      },
      thumbnail: {
        width: parseInt(req.body.thumbWidth) || 300,
        height: parseInt(req.body.thumbHeight) || 300,
        quality: parseInt(req.body.thumbQuality) || 70,
      },
    };

    const filePaths = req.files.map(file => file.path);
    // 1. Tạo array promises cho việc upload
    const uploadPromises = req.files.map(file =>
      cloudinary.uploader.upload(file.path, {
        folder: options.folder || 'internbridge',
        transformation: [
          {
            width: options.optimization?.maxWidth || 1920,
            height: options.optimization?.maxHeight || 1080,
            crop: 'limit',
          },
          {
            quality: options.optimization?.quality || 80,
            fetch_format: 'auto',
          },
        ],
      })
    );

    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads = results.filter(
      result => result.status === 'fulfilled'
    );
    const failedUploads = results.filter(
      result => result.status === 'rejected'
    );

    logger.info('Multiple images upload completed', {
      userId: req.user?.id,
      totalFiles: req.files.length,
      successful: successfulUploads.length,
      failed: failedUploads.length,
    });

    res.status(200).json({
      success: true,
      message: `Upload ${successfulUploads.length}/${req.files.length} ảnh thành công`,
      data: {
        totalFiles: req.files.length,
        successful: successfulUploads.length,
        failed: failedUploads.length,
        results: successfulUploads.map((result, index) => ({
          originalName: req.files[index].originalname,
          originalSize: req.files[index].size,
          publicId: result.value.public_id,
          url: result.value.secure_url,
          size: result.value.bytes,
          format: result.value.format,
          dimensions: {
            width: result.value.width,
            height: result.value.height,
          },
        })),
      },
    });
  } catch (error) {
    logger.error('Multiple images upload failed:', {
      error: error.message,
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Upload nhiều ảnh thất bại',
    });
  }
});

// @desc    Upload profile avatar
// @route   POST /api/upload/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'Không có file nào được upload' });
    }

    const result = await uploadImage('avatar', req.file.buffer);

    logger.info('Avatar upload successful', {
      userId: req.user.id,
      originalName: req.file.originalname,
      publicId: result.publicId,
    });

    res.status(200).json({
      success: true,
      message: 'Upload avatar thành công',
      data: {
        avatar: {
          publicId: result.publicId,
          url: result.url,
          size: result.bytes,
          format: result.format,
          dimensions: { width: result.width, height: result.height },
        },
      },
    });
  } catch (error) {
    logger.error('Avatar upload failed:', {
      error: error.message,
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Upload avatar thất bại',
    });
  }
});

// @desc    Upload company logo
// @route   POST /api/upload/logo
// @access  Private (Employer/Admin)
const uploadCompanyLogo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file nào được upload',
      });
    }

    const options = {};

    const result = await uploadImage('logo', req.file.buffer);

    logger.info('Company logo upload successful', {
      userId: req.user.id,
      originalName: req.file.originalname,
      publicId: result.publicId,
    });

    // Optionally attach the uploaded logo to the employer's company automatically
    // Default: attach = true (can be disabled with ?attach=false)
    let attached = false;
    let companyId = null;
    try {
      const shouldAttach = (req.query.attach ?? 'true') !== 'false';
      if (shouldAttach) {
        const company = await Company.findByOwner(req.user.id);
        if (company) {
          company.logo = {
            url: result.url,
            filename: result.publicId,
            uploadedAt: new Date(),
          };
          await company.save();
          attached = true;
          companyId = company._id;
        }
      }
    } catch (attachError) {
      logger.warn('Auto-attach company logo skipped:', {
        error: attachError.message,
        userId: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Upload logo công ty thành công',
      data: {
        logo: {
          publicId: result.publicId,
          url: result.url,
          size: result.bytes,
          format: result.format,
          dimensions: {
            width: result.width,
            height: result.height,
          },
        },
        attached,
        companyId,
      },
    });
  } catch (error) {
    logger.error('Company logo upload failed:', {
      error: error.message,
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Upload logo công ty thất bại',
    });
  }
});

// @desc    Delete image
// @route   DELETE /api/upload/:publicId
// @access  Private
const deleteImage = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID không được cung cấp',
      });
    }

    const result = await imageService.deleteFromCloudinary(publicId);

    if (result) {
      logger.info('Image deleted successfully', {
        userId: req.user.id,
        publicId,
      });

      res.status(200).json({
        success: true,
        message: 'Xóa ảnh thành công',
        data: { publicId },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Không thể xóa ảnh',
      });
    }
  } catch (error) {
    logger.error('Image deletion failed:', {
      error: error.message,
      userId: req.user?.id,
      publicId: req.params.publicId,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Xóa ảnh thất bại',
    });
  }
});

// @desc    Get image info
// @route   GET /api/upload/:publicId/info
// @access  Private
const getImageInfo = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID không được cung cấp',
      });
    }

    const imageInfo = await imageService.getImageInfo(publicId);

    res.status(200).json({
      success: true,
      data: imageInfo,
    });
  } catch (error) {
    logger.error('Get image info failed:', {
      error: error.message,
      userId: req.user?.id,
      publicId: req.params.publicId,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Không thể lấy thông tin ảnh',
    });
  }
});

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadAvatar,
  uploadCompanyLogo,
  deleteImage,
  getImageInfo,
};
