const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const EmployerProfileResponseDTO = require('../dtos/EmployerProfileResponseDTO');
const CompanyResponseDTO = require('../dtos/CompanyResponseDTO');

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
      employerId: req.user.employerId,
    });

    res.status(200).json({
      success: true,
      data: CompanyResponseDTO.fromCompany(result.company).toJSON(),
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
      employerId: req.user.employerId,
      companyData: req.body,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: CompanyResponseDTO.fromCompany(result.company).toJSON(),
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
      employerId: req.user.employerId,
    });

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

// @desc    Get dashboard data
// @route   GET /api/employers/dashboard
// @access  Private (Employer)
const getDashboard = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const result = await getEmployerProfileUseCase.execute({
      employerId: req.user.employerId,
    });

    res.status(200).json({
      success: true,
      data: result.dashboard,
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
  getEmployerStats,
  getDashboard,
};
