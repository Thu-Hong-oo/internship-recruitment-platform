const EmployerProfile = require('../models/EmployerProfile');
const Company = require('../models/Company');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// @desc    Get employer profile
// @route   GET /api/employer-profile
// @access  Private (Employer)
const getEmployerProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({ userId: req.user.id })
      .populate('companyId', 'name logo industry description location size');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ nhà tuyển dụng'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error getting employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy hồ sơ nhà tuyển dụng'
    });
  }
});

// @desc    Create employer profile
// @route   POST /api/employer-profile
// @access  Private (Employer)
const createEmployerProfile = asyncHandler(async (req, res) => {
  try {
    // Check if profile already exists
    const existingProfile = await EmployerProfile.findOne({ userId: req.user.id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Hồ sơ nhà tuyển dụng đã tồn tại'
      });
    }

    const profileData = {
      ...req.body,
      userId: req.user.id,
      companyId: req.user.companyId
    };

    const profile = await EmployerProfile.create(profileData);

    await profile.populate('companyId', 'name logo industry description location size');

    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error creating employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo hồ sơ nhà tuyển dụng'
    });
  }
});

// @desc    Update employer profile
// @route   PUT /api/employer-profile
// @access  Private (Employer)
const updateEmployerProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ nhà tuyển dụng'
      });
    }

    const updatedProfile = await EmployerProfile.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('companyId', 'name logo industry description location size');

    res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    logger.error('Error updating employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hồ sơ nhà tuyển dụng'
    });
  }
});

// @desc    Update company information
// @route   PUT /api/employer-profile/company
// @access  Private (Employer)
const updateCompanyInfo = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin công ty'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.user.companyId,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCompany
    });
  } catch (error) {
    logger.error('Error updating company info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin công ty'
    });
  }
});

// @desc    Get company information
// @route   GET /api/employer-profile/company
// @access  Private (Employer)
const getCompanyInfo = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin công ty'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Error getting company info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công ty'
    });
  }
});

// @desc    Upload company logo
// @route   POST /api/employer-profile/company/logo
// @access  Private (Employer)
const uploadCompanyLogo = asyncHandler(async (req, res) => {
  try {
    const { logoUrl } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      { logo: logoUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Error uploading company logo:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên logo công ty'
    });
  }
});

// @desc    Get employer dashboard data
// @route   GET /api/employer-profile/dashboard
// @access  Private (Employer)
const getEmployerDashboard = asyncHandler(async (req, res) => {
  try {
    const Job = require('../models/Job');
    const Application = require('../models/Application');

    // Get company's jobs
    const totalJobs = await Job.countDocuments({ companyId: req.user.companyId });
    const activeJobs = await Job.countDocuments({ 
      companyId: req.user.companyId, 
      status: 'active' 
    });

    // Get total applications
    const jobs = await Job.find({ companyId: req.user.companyId });
    const jobIds = jobs.map(job => job._id);
    
    const totalApplications = await Application.countDocuments({
      jobId: { $in: jobIds }
    });

    // Get recent applications
    const recentApplications = await Application.find({
      jobId: { $in: jobIds }
    })
      .populate('jobId', 'title')
      .populate('jobseekerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get applications by status
    const applicationsByStatus = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const dashboardData = {
      totalJobs,
      activeJobs,
      totalApplications,
      recentApplications,
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error getting employer dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu dashboard'
    });
  }
});

// @desc    Get profile completion status
// @route   GET /api/employer-profile/completion
// @access  Private (Employer)
const getProfileCompletion = asyncHandler(async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({ userId: req.user.id });
    const company = await Company.findById(req.user.companyId);

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          completionPercentage: 0,
          completedFields: [],
          missingFields: [
            'personalInfo',
            'companyInfo',
            'companyLogo',
            'companyDescription'
          ]
        }
      });
    }

    const completedFields = [];
    const missingFields = [];

    // Check each field
    if (profile.personalInfo?.bio) completedFields.push('personalInfo');
    else missingFields.push('personalInfo');

    if (company?.name && company?.industry) completedFields.push('companyInfo');
    else missingFields.push('companyInfo');

    if (company?.logo) completedFields.push('companyLogo');
    else missingFields.push('companyLogo');

    if (company?.description) completedFields.push('companyDescription');
    else missingFields.push('companyDescription');

    const completionPercentage = Math.round(
      (completedFields.length / 4) * 100
    );

    res.status(200).json({
      success: true,
      data: {
        completionPercentage,
        completedFields,
        missingFields
      }
    });
  } catch (error) {
    logger.error('Error getting profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trạng thái hoàn thành hồ sơ'
    });
  }
});

// @desc    Delete employer profile
// @route   DELETE /api/employer-profile
// @access  Private (Employer)
const deleteEmployerProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ nhà tuyển dụng'
      });
    }

    await profile.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa hồ sơ nhà tuyển dụng thành công'
    });
  } catch (error) {
    logger.error('Error deleting employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hồ sơ nhà tuyển dụng'
    });
  }
});

module.exports = {
  getEmployerProfile,
  createEmployerProfile,
  updateEmployerProfile,
  updateCompanyInfo,
  getCompanyInfo,
  uploadCompanyLogo,
  getEmployerDashboard,
  getProfileCompletion,
  deleteEmployerProfile
};
