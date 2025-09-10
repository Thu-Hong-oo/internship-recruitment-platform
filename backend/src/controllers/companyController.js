const Company = require('../models/Company');
const Job = require('../models/Job');
const { logger } = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
const getAllCompanies = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      industry,
      location,
      size,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Other filters
    if (industry) query.industry = industry;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (size) query.size = size;

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const companies = await Company.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      data: companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công ty',
    });
  }
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
const getCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công ty',
      });
    }

    // Get company's active jobs count
    const activeJobsCount = await Job.countDocuments({
      companyId: company._id,
      status: 'active',
    });

    res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        activeJobsCount,
      },
    });
  } catch (error) {
    logger.error('Error getting company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công ty',
    });
  }
});

// @desc    Create new company (for employer registration)
// @route   POST /api/companies
// @access  Private (Employer)
const createCompany = asyncHandler(async (req, res) => {
  try {
    const companyData = req.body;

    // Set owner as the user who created the company
    companyData.owner = req.user.id;
    // Also set createdBy for model validation and auditing
    companyData.createdBy = req.user.id;

    // Set default status
    companyData.status = 'active'; // Cho phép đăng job ngay

    const company = await Company.create(companyData);

    res.status(201).json({
      success: true,
      data: company,
      message: 'Tạo thông tin công ty thành công. Bạn có thể đăng tin tuyển dụng ngay.',
    });
  } catch (error) {
    logger.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo thông tin công ty',
      error: error.message,
    });
  }
});

// @desc    Update company (by owner)
// @route   PUT /api/companies/:id
// @access  Private (Owner/Admin)
const updateCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công ty',
      });
    }

    // Check ownership or admin
    if (!company.canManage(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật thông tin công ty này',
      });
    }

    const updateData = req.body;

    // If not admin, keep status as active (no need to re-approve)
    // Admin can still suspend/inactivate if needed

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCompany,
      message: 'Cập nhật thông tin công ty thành công',
    });
  } catch (error) {
    logger.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin công ty',
      error: error.message,
    });
  }
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Admin)
const deleteCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công ty',
      });
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa công ty thành công',
    });
  } catch (error) {
    logger.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công ty',
    });
  }
});

// @desc    Get company's jobs
// @route   GET /api/companies/:id/jobs
// @access  Public
const getCompanyJobs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({
      companyId: req.params.id,
      status,
    })
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      companyId: req.params.id,
      status,
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting company jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc của công ty',
    });
  }
});

// @desc    Get my company (for employer)
// @route   GET /api/companies/me
// @access  Private (Employer)
const getMyCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findByOwner(req.user.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa tạo thông tin công ty',
      });
    }

    // Get company's active jobs count
    const activeJobsCount = await Job.countDocuments({
      companyId: company._id,
      status: 'active',
    });

    res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        activeJobsCount,
      },
    });
  } catch (error) {
    logger.error('Error getting my company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công ty của bạn',
    });
  }
});

// @desc    Update my company (for employer)
// @route   PUT /api/companies/me
// @access  Private (Employer)
const updateMyCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findByOwner(req.user.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa tạo thông tin công ty',
      });
    }

    const updateData = req.body;
    // Keep status as active - no need to re-approve company info

    const updatedCompany = await Company.findByIdAndUpdate(
      company._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCompany,
      message: 'Cập nhật thông tin công ty thành công',
    });
  } catch (error) {
    logger.error('Error updating my company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin công ty',
      error: error.message,
    });
  }
});

// @desc    Get company statistics
// @route   GET /api/companies/:id/stats
// @access  Public
const getCompanyStats = asyncHandler(async (req, res) => {
  try {
    const companyId = req.params.id;

    const totalJobs = await Job.countDocuments({ companyId });
    const activeJobs = await Job.countDocuments({
      companyId,
      status: 'active',
    });
    const totalApplications = await Job.aggregate([
      { $match: { companyId: companyId } },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'jobId',
          as: 'applications',
        },
      },
      { $unwind: '$applications' },
      { $count: 'total' },
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications: totalApplications[0]?.total || 0,
      companySize: 'Unknown', // This would come from company data
      foundedYear: 'Unknown', // This would come from company data
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê công ty',
    });
  }
});

// @desc    Update my company logo (attach existing uploaded image)
// @route   PUT /api/companies/me/logo
// @access  Private (Employer)
const updateMyCompanyLogo = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findByOwner(req.user.id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: 'Bạn chưa tạo thông tin công ty' });
    }

    const { url, publicId, filename } = req.body.logo || {};
    if (!url || (!publicId && !filename)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu logo.url hoặc publicId/filename',
      });
    }

    company.logo = {
      url,
      filename: filename || publicId,
      uploadedAt: new Date(),
    };

    // Keep status as active - logo update doesn't need approval

    await company.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật logo công ty thành công',
      data: company.logo,
    });
  } catch (error) {
    logger.error('Error updating company logo:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi khi cập nhật logo công ty' });
  }
});

module.exports = {
  getAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyJobs,
  getMyCompany,
  updateMyCompany,
  getCompanyStats,
  updateMyCompanyLogo,
};
