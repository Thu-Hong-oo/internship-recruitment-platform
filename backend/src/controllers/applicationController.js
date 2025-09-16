const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// @desc    Get all applications for a user
// @route   GET /api/applications
// @access  Private (Candidate)
const getUserApplications = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { jobseekerId: req.user.id };
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate('jobId', 'title companyId location salary')
      .populate('jobId.companyId', 'name logo industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting user applications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn ứng tuyển'
    });
  }
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (Candidate/Employer)
const getApplication = asyncHandler(async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId', 'title companyId location salary requirements')
      .populate('jobId.companyId', 'name logo industry')
      .populate('jobseekerId', 'firstName lastName email avatar');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển'
      });
    }

    // Check if user has permission to view this application
    const isOwner = application.jobseekerId._id.toString() === req.user.id;
    const isEmployer = req.user.role === 'employer' && 
      application.jobId.companyId._id.toString() === req.user.companyId.toString();

    if (!isOwner && !isEmployer) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem đơn ứng tuyển này'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Error getting application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đơn ứng tuyển'
    });
  }
});

// @desc    Create new application
// @route   POST /api/applications
// @access  Private (Candidate)
const createApplication = asyncHandler(async (req, res) => {
  try {
    const { jobId, coverLetter, resumeUrl, portfolioUrl } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      jobseekerId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã ứng tuyển cho công việc này'
      });
    }

    // Check application deadline
    if (job.applicationSettings?.deadline && 
        new Date() > job.applicationSettings.deadline) {
      return res.status(400).json({
        success: false,
        message: 'Đã hết hạn ứng tuyển'
      });
    }

    const application = await Application.create({
      jobId,
      jobseekerId: req.user.id,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      status: 'pending'
    });

    await application.populate('jobId', 'title companyId');
    await application.populate('jobId.companyId', 'name logo');

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn ứng tuyển'
    });
  }
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private (Candidate)
const updateApplication = asyncHandler(async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển'
      });
    }

    // Check ownership
    if (application.jobseekerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa đơn ứng tuyển này'
      });
    }

    // Only allow updates if status is pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Không thể chỉnh sửa đơn ứng tuyển đã được xử lý'
      });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('jobId', 'title companyId');

    res.status(200).json({
      success: true,
      data: updatedApplication
    });
  } catch (error) {
    logger.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật đơn ứng tuyển'
    });
  }
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private (Candidate)
const deleteApplication = asyncHandler(async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển'
      });
    }

    // Check ownership
    if (application.jobseekerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa đơn ứng tuyển này'
      });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa đơn ứng tuyển thành công'
    });
  } catch (error) {
    logger.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa đơn ứng tuyển'
    });
  }
});

// @desc    Update application status (for employers)
// @route   PUT /api/applications/:id/status
// @access  Private (Employer)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn ứng tuyển'
      });
    }

    // Check if user is employer of the job
    const job = await Job.findById(application.jobId);
    if (!job || job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật trạng thái đơn ứng tuyển này'
      });
    }

    application.status = status;
    if (feedback) application.feedback = feedback;
    await application.save();

    await application.populate('jobseekerId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn ứng tuyển'
    });
  }
});

// @desc    Get applications for employer's jobs
// @route   GET /api/applications/employer
// @access  Private (Employer)
const getEmployerApplications = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status, jobId } = req.query;
    const skip = (page - 1) * limit;

    // Get all jobs for this employer
    const jobs = await Job.find({ companyId: req.user.companyId });
    const jobIds = jobs.map(job => job._id);

    const query = { jobId: { $in: jobIds } };
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    const applications = await Application.find(query)
      .populate('jobId', 'title companyId')
      .populate('jobseekerId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting employer applications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn ứng tuyển'
    });
  }
});

module.exports = {
  getUserApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
  getEmployerApplications
};
