const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const EmployerProfileResponseDTO = require('../dtos/EmployerProfileResponseDTO');
const CompanyResponseDTO = require('../dtos/CompanyResponseDTO');
const UnifiedUploadService = require('../../infrastructure/services/external/core/UnifiedUploadService');

// NOTE: Profile creation is now handled automatically during user registration
// See RegisterUserUseCase.createUserProfile() for implementation

// @desc    Get employer profile
// @route   GET /api/employers/profile
// @access  Private (Employer)
const getProfile = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const result = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    // If profile not created yet, return flag for frontend to show profile creation form
    if (result.requiresProfileCreation) {
      return res.status(200).json({
        success: true,
        requiresProfileCreation: true,
        message: 'Vui lòng hoàn thành đăng ký thông tin công ty',
      });
    }

    res.status(200).json({
      success: true,
      data: EmployerProfileResponseDTO.fromEmployerProfile(
        result.employer
      ).toJSON(),
    });
  } catch (error) {
    if (error.message === 'PROFILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hồ sơ nhà tuyển dụng',
      });
    }

    logger.error('Get employer profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update employer profile
// @route   PATCH /api/employers/profile
// @access  Private (Employer)
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const updateEmployerProfileUseCase = req.container.resolve(
      'updateEmployerProfileUseCase'
    );

    const result = await updateEmployerProfileUseCase.execute({
      userId: req.user.id,
      profileData: req.body,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: EmployerProfileResponseDTO.fromEmployerProfile(
        result.employer
      ).toJSON(),
    });
  } catch (error) {
    if (error.message === 'PROFILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hồ sơ nhà tuyển dụng',
      });
    }

    logger.error('Update employer profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// NOTE: Company creation is now handled through profile updates
// Employers can update their company info via updateProfile endpoint

// @desc    Get company
// @route   GET /api/employers/company
// @access  Private (Employer)
const getCompany = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const result = await getEmployerProfileUseCase.execute({
      userId: req.user.id, // Use userId instead of employerId
    });

    // Debug logging
    console.log('Get company - Employer profile result:', {
      requiresProfileCreation: result.requiresProfileCreation,
      hasEmployer: !!result.employer,
      employerCompanyId: result.employer?.companyId,
      hasCompany: !!result.employer?.company,
    });

    // If profile not created yet, return error
    if (result.requiresProfileCreation || !result.employer?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy thông tin công ty',
      });
    }

    // Get company directly from repository
    const companyRepository = req.container.resolve('companyRepository');
    const company = await companyRepository.findById(result.employer.companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy thông tin công ty',
      });
    }

    res.status(200).json({
      success: true,
      data: CompanyResponseDTO.fromCompany(company).toJSON(),
    });
  } catch (error) {
    logger.error('Get company error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update company
// @route   PUT /api/employers/company
// @access  Private (Employer)
const updateCompany = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const updateEmployerProfileUseCase = req.container.resolve(
      'updateEmployerProfileUseCase'
    );

    const result = await updateEmployerProfileUseCase.execute({
      userId: req.user.id, // Use userId instead of employerId
      companyData: req.body,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.company
        ? CompanyResponseDTO.fromCompany(result.company).toJSON()
        : null,
    });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get employer stats
// @route   GET /api/employers/stats
// @access  Private (Employer)
const getEmployerStats = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const result = await getEmployerProfileUseCase.execute({
      userId: req.user.id, // Use userId instead of employerId
    });

    // If profile not created yet, return empty stats
    if (result.requiresProfileCreation) {
      return res.status(200).json({
        success: true,
        data: {},
      });
    }

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get employer stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Upload company logo
// @route   POST /api/employers/company/upload-logo
// @access  Private (Employer)
const uploadLogo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không tìm thấy file logo',
      });
    }

    // Upload to cloud storage
    const uploadResult = await UnifiedUploadService.uploadFile({
      file: req.file,
      type: 'logo',
      userId: req.user.id,
    });

    // Update company logo
    const updateEmployerProfileUseCase = req.container.resolve(
      'updateEmployerProfileUseCase'
    );

    const result = await updateEmployerProfileUseCase.execute({
      userId: req.user.id,
      companyData: { logo: uploadResult.url },
    });

    res.status(200).json({
      success: true,
      message: 'Logo công ty đã được cập nhật thành công',
      data: {
        logo: uploadResult.url,
        company: CompanyResponseDTO.fromCompany(result.company).toJSON(),
      },
    });
  } catch (error) {
    logger.error('Upload logo error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Upload company cover image
// @route   POST /api/employers/company/upload-cover-image
// @access  Private (Employer)
const uploadCoverImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không tìm thấy file ảnh bìa',
      });
    }

    // Upload to cloud storage
    const uploadResult = await UnifiedUploadService.uploadFile({
      file: req.file,
      type: 'coverImage',
      userId: req.user.id,
    });

    // Update company cover image
    const updateEmployerProfileUseCase = req.container.resolve(
      'updateEmployerProfileUseCase'
    );

    const result = await updateEmployerProfileUseCase.execute({
      userId: req.user.id,
      companyData: { coverImage: uploadResult.url },
    });

    res.status(200).json({
      success: true,
      message: 'Ảnh bìa công ty đã được cập nhật thành công',
      data: {
        coverImage: uploadResult.url,
        company: CompanyResponseDTO.fromCompany(result.company).toJSON(),
      },
    });
  } catch (error) {
    logger.error('Upload cover image error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Upload employer avatar
// @route   POST /api/employers/profile/upload-avatar
// @access  Private (Employer)
const uploadAvatar = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không tìm thấy file avatar',
      });
    }

    // Upload to cloud storage
    const uploadResult = await UnifiedUploadService.uploadFile({
      file: req.file,
      type: 'avatar',
      userId: req.user.id,
    });

    // Update employer profile avatar
    const updateEmployerProfileUseCase = req.container.resolve(
      'updateEmployerProfileUseCase'
    );

    const result = await updateEmployerProfileUseCase.execute({
      userId: req.user.id,
      profileData: { avatar: uploadResult.url },
    });

    res.status(200).json({
      success: true,
      message: 'Avatar đã được cập nhật thành công',
      data: {
        avatar: uploadResult.url,
        employer: EmployerProfileResponseDTO.fromEmployerProfile(
          result.employer
        ).toJSON(),
      },
    });
  } catch (error) {
    logger.error('Upload avatar error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Upload employer profile cover image
// @route   POST /api/employers/profile/upload-cover-image
// @access  Private (Employer)
const uploadProfileCoverImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không tìm thấy file ảnh bìa',
      });
    }

    // Upload to cloud storage
    const uploadResult = await UnifiedUploadService.uploadFile({
      file: req.file,
      type: 'coverImage',
      userId: req.user.id,
    });

    // Update employer profile cover image
    const updateEmployerProfileUseCase = req.container.resolve(
      'updateEmployerProfileUseCase'
    );

    const result = await updateEmployerProfileUseCase.execute({
      userId: req.user.id,
      profileData: { coverImage: uploadResult.url },
    });

    res.status(200).json({
      success: true,
      message: 'Ảnh bìa hồ sơ đã được cập nhật thành công',
      data: {
        coverImage: uploadResult.url,
        employer: EmployerProfileResponseDTO.fromEmployerProfile(
          result.employer
        ).toJSON(),
      },
    });
  } catch (error) {
    logger.error('Upload profile cover image error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get employer dashboard
// @route   GET /api/employers/dashboard
// @access  Private (Employer)
const getDashboard = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const result = await getEmployerProfileUseCase.execute({
      userId: req.user.id, // Use userId instead of employerId
    });

    // If profile not created yet, return empty dashboard
    if (result.requiresProfileCreation) {
      return res.status(200).json({
        success: true,
        data: {
          profile: null,
          stats: {},
          recentActivity: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: EmployerProfileResponseDTO.fromEmployerProfile(
          result.employer
        ).toJSON(),
        stats: result.stats || {},
        recentActivity: result.recentActivity || [],
      },
    });
  } catch (error) {
    logger.error('Get employer dashboard error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  getProfile,
  updateProfile,
  getCompany,
  updateCompany,
  uploadLogo,
  uploadCoverImage,
  uploadAvatar,
  uploadProfileCoverImage,
  getEmployerStats,
  getDashboard,
};
