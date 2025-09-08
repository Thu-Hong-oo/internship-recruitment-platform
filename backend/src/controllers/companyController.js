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
      search
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công ty'
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
        message: 'Không tìm thấy công ty'
      });
    }

    // Get company's active jobs count
    const activeJobsCount = await Job.countDocuments({
      companyId: company._id,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        activeJobsCount
      }
    });
  } catch (error) {
    logger.error('Error getting company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công ty'
    });
  }
});

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Admin)
const createCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công ty'
    });
  }
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Admin/Owner)
const updateCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công ty'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCompany
    });
  } catch (error) {
    logger.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật công ty'
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
        message: 'Không tìm thấy công ty'
      });
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa công ty thành công'
    });
  } catch (error) {
    logger.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công ty'
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
      status
    })
      .populate('companyId', 'name logo industry')
      .populate('requirements.skills.skillId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      companyId: req.params.id,
      status
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting company jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc của công ty'
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
    const activeJobs = await Job.countDocuments({ companyId, status: 'active' });
    const totalApplications = await Job.aggregate([
      { $match: { companyId: companyId } },
      { $lookup: {
        from: 'applications',
        localField: '_id',
        foreignField: 'jobId',
        as: 'applications'
      }},
      { $unwind: '$applications' },
      { $count: 'total' }
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications: totalApplications[0]?.total || 0,
      companySize: 'Unknown', // This would come from company data
      foundedYear: 'Unknown' // This would come from company data
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê công ty'
    });
  }
});

module.exports = {
  getAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyJobs,
  getCompanyStats
};
