const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const { logger } = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// @desc    Get user's saved jobs
// @route   GET /api/saved-jobs
// @access  Private (Candidate)
const getSavedJobs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, category, location } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    const savedJobs = await SavedJob.find(query)
      .populate({
        path: 'jobId',
        match: { status: 'active' },
        populate: [
          { path: 'companyId', select: 'name logo industry' },
          { path: 'requirements.skills.skillId', select: 'name category' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out null jobIds (deleted jobs)
    const validSavedJobs = savedJobs.filter(savedJob => savedJob.jobId);

    const total = await SavedJob.countDocuments(query);

    res.status(200).json({
      success: true,
      data: validSavedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting saved jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc đã lưu'
    });
  }
});

// @desc    Save a job
// @route   POST /api/saved-jobs
// @access  Private (Candidate)
const saveJob = asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check if already saved
    const existingSavedJob = await SavedJob.findOne({
      userId: req.user.id,
      jobId
    });

    if (existingSavedJob) {
      return res.status(400).json({
        success: false,
        message: 'Công việc đã được lưu trước đó'
      });
    }

    const savedJob = await SavedJob.create({
      userId: req.user.id,
      jobId
    });

    await savedJob.populate({
      path: 'jobId',
      populate: [
        { path: 'companyId', select: 'name logo industry' },
        { path: 'requirements.skills.skillId', select: 'name category' }
      ]
    });

    res.status(201).json({
      success: true,
      data: savedJob
    });
  } catch (error) {
    logger.error('Error saving job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu công việc'
    });
  }
});

// @desc    Remove saved job
// @route   DELETE /api/saved-jobs/:id
// @access  Private (Candidate)
const removeSavedJob = asyncHandler(async (req, res) => {
  try {
    const savedJob = await SavedJob.findById(req.params.id);

    if (!savedJob) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc đã lưu'
      });
    }

    // Check ownership
    if (savedJob.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa công việc đã lưu này'
      });
    }

    await savedJob.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa công việc khỏi danh sách đã lưu'
    });
  } catch (error) {
    logger.error('Error removing saved job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công việc đã lưu'
    });
  }
});

// @desc    Remove saved job by jobId
// @route   DELETE /api/saved-jobs/job/:jobId
// @access  Private (Candidate)
const removeSavedJobByJobId = asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;

    const savedJob = await SavedJob.findOne({
      userId: req.user.id,
      jobId
    });

    if (!savedJob) {
      return res.status(404).json({
        success: false,
        message: 'Công việc chưa được lưu'
      });
    }

    await savedJob.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa công việc khỏi danh sách đã lưu'
    });
  } catch (error) {
    logger.error('Error removing saved job by jobId:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công việc đã lưu'
    });
  }
});

// @desc    Check if job is saved
// @route   GET /api/saved-jobs/check/:jobId
// @access  Private (Candidate)
const checkJobSaved = asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;

    const savedJob = await SavedJob.findOne({
      userId: req.user.id,
      jobId
    });

    res.status(200).json({
      success: true,
      data: {
        isSaved: !!savedJob,
        savedJobId: savedJob?._id
      }
    });
  } catch (error) {
    logger.error('Error checking if job is saved:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái lưu công việc'
    });
  }
});

// @desc    Get saved jobs count
// @route   GET /api/saved-jobs/count
// @access  Private (Candidate)
const getSavedJobsCount = asyncHandler(async (req, res) => {
  try {
    const count = await SavedJob.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Error getting saved jobs count:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy số lượng công việc đã lưu'
    });
  }
});

// @desc    Clear all saved jobs
// @route   DELETE /api/saved-jobs
// @access  Private (Candidate)
const clearAllSavedJobs = asyncHandler(async (req, res) => {
  try {
    await SavedJob.deleteMany({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Đã xóa tất cả công việc đã lưu'
    });
  } catch (error) {
    logger.error('Error clearing all saved jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tất cả công việc đã lưu'
    });
  }
});

// @desc    Get saved jobs by category
// @route   GET /api/saved-jobs/category/:category
// @access  Private (Candidate)
const getSavedJobsByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const savedJobs = await SavedJob.find({ userId: req.user.id })
      .populate({
        path: 'jobId',
        match: { 
          status: 'active',
          'aiAnalysis.category': category 
        },
        populate: [
          { path: 'companyId', select: 'name logo industry' },
          { path: 'requirements.skills.skillId', select: 'name category' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out null jobIds
    const validSavedJobs = savedJobs.filter(savedJob => savedJob.jobId);

    const total = await SavedJob.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      data: validSavedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting saved jobs by category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy công việc đã lưu theo danh mục'
    });
  }
});

module.exports = {
  getSavedJobs,
  saveJob,
  removeSavedJob,
  removeSavedJobByJobId,
  checkJobSaved,
  getSavedJobsCount,
  clearAllSavedJobs,
  getSavedJobsByCategory
};
