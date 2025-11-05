const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const JobResponseDTO = require('../dtos/JobResponseDTO');
const ApplicationResponseDTO = require('../dtos/ApplicationResponseDTO');

// Import use cases from DI container

// @desc    Get all jobs with filtering and pagination (supports text search)
// @route   GET /api/jobs
// @access  Public
const getAllJobs = asyncHandler(async (req, res) => {
  try {
    const result = await getAllJobsUseCase.execute({
      filters: req.query,
      options: {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      },
      userRole: req.user?.role,
    });

    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPosts(result.jobs),
      pagination: result.pagination,
      filters: result.filters,
    });
  } catch (error) {
    logger.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc',
    });
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJob = asyncHandler(async (req, res) => {
  try {
    const result = await getJobUseCase.execute({
      jobId: req.params.id,
    });

    // Additional logic for checking if user has applied
    let hasApplied = false;
    if (req.user && req.user.role === 'candidate') {
      // TODO: Implement application check logic
      // This should be moved to a separate use case
      hasApplied = false;
    }

    res.status(200).json({
      success: true,
      data: {
        ...JobResponseDTO.fromJobPost(result.job).toJSON(),
        hasApplied,
      },
    });
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    logger.error('Error getting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công việc',
    });
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
const createJob = asyncHandler(async (req, res) => {
  try {
    // TODO: Add employer verification logic here or in use case
    const result = await createJobUseCase.execute({
      employerId: req.user.employerId,
      jobData: {
        ...req.body,
        postedBy: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      data: JobResponseDTO.fromJobPost(result.job),
      message: 'Tạo job thành công, đang ở trạng thái nháp',
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công việc',
      error: error.message,
    });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
const updateJob = asyncHandler(async (req, res) => {
  try {
    const result = await updateJobUseCase.execute({
      jobId: req.params.id,
      updateData: req.body,
      employerId: req.user.employerId,
      userRole: req.user.role,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPost(result.job),
    });
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa job này',
      });
    }

    logger.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật công việc',
      error: error.message,
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
const deleteJob = asyncHandler(async (req, res) => {
  try {
    const result = await deleteJobUseCase.execute({
      jobId: req.params.id,
      employerId: req.user.employerId,
      userRole: req.user.role,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa job này',
      });
    }

    logger.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công việc',
      error: error.message,
    });
  }
});

// @desc    Get job applications
// @route   GET /api/jobs/:id/applications
// @access  Private (Employer)
const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const job = await Job.findById(id);
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }
    // Chỉ employer của job hoặc admin mới được xem
    if (
      req.user.role !== 'admin' &&
      String(job.postedBy) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem danh sách ứng viên của job này',
      });
    }
    const query = { jobId: id };
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const applications = await Application.find(query)
      .populate({
        path: 'candidateId',
        select: 'userId resume education skills',
        populate: { path: 'userId', select: 'fullName email avatar' },
      })
      .populate('jobId', 'title employer')
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
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ứng viên',
    });
  }
};

// @desc    Get job by slug
// @route   GET /api/jobs/slug/:slug
// @access  Public
const getJobBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const job = await Job.findOne({ slug, status: JobStatus.PUBLISHED })
      .populate('employer', 'name logo industry description')
      .populate('postedBy', 'fullName name email avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPost(job),
    });
  } catch (error) {
    logger.error('Error getting job by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công việc',
    });
  }
};

// @desc    Increment job views
// @route   POST /api/jobs/:id/view
// @access  Public
const incrementJobViews = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật lượt xem',
    });
  } catch (error) {
    logger.error('Error incrementing job views:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lượt xem',
    });
  }
};

// @desc    Get recent jobs
// @route   GET /api/jobs/recent
// @access  Public
const getRecentJobs = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;

    const query = { status: JobStatus.PUBLISHED };
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('employer', 'name logo industry description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPosts(jobs),
      total,
      limit: parseInt(limit),
      message: `Tìm thấy ${total} công việc gần đây`,
    });
  } catch (error) {
    logger.error('Error getting recent jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc gần đây',
    });
  }
};

// @desc    Get company info for job display
// @route   GET /api/jobs/:id/company
// @access  Public
const getJobCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id).populate(
      'employer',
      'name logo industry description'
    );
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }
    res.status(200).json({
      success: true,
      data: {
        company: job.employer,
        jobTitle: job.title,
        jobId: job._id,
      },
    });
  } catch (error) {
    logger.error('Error getting job company:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công ty',
    });
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/:id/stats
// @access  Public
const getJobStats = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const stats = {
      views: job.views || 0,
    };
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting job stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê công việc',
    });
  }
};

// @desc    Get all jobs posted by current employer (including drafts)
// @route   GET /api/jobs/employer
// @access  Private (Employer only)
const getEmployerJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Tìm employer profile của user hiện tại
    const EmployerProfile = require('../../infrastructure/models/EmployerProfile');
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });

    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }

    const query = { employer: employerProfile._id };

    // Filter theo status nếu có
    if (status) {
      query.status = status;
    } else {
      // Mặc định loại trừ jobs đã deleted, trừ khi explicitly request
      if (req.query.includeDeleted !== 'true') {
        query.status = { $ne: JobStatus.ARCHIVED };
      }
    }

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate(
        'employer',
        'company.name company.logo company.industry company.description'
      )
      .populate('postedBy', 'fullName name email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    // Thống kê theo status
    const statusMatchQuery = { employer: employerProfile._id };
    // Chỉ count deleted jobs nếu explicitly request
    if (req.query.includeDeleted !== 'true') {
      statusMatchQuery.status = { $ne: JobStatus.ARCHIVED };
    }

    const statusCounts = await Job.aggregate([
      { $match: statusMatchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusStats = {};
    statusCounts.forEach(item => {
      statusStats[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPosts(jobs),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: {
        total,
        byStatus: statusStats,
      },
    });
  } catch (error) {
    logger.error('Error getting employer jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách job của employer',
    });
  }
};

// @desc    Get draft jobs by current employer
// @route   GET /api/jobs/drafts
// @access  Private (Employer only)
const getDraftJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = req.query;

    // Tìm employer profile của user hiện tại
    const EmployerProfile = require('../../infrastructure/models/EmployerProfile');
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });

    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }

    const query = {
      employer: employerProfile._id,
      status: JobStatus.DRAFT,
    };

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate('employer', 'company.name company.logo company.industry')
      .populate('postedBy', 'fullName name email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPosts(jobs),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      message: `Tìm thấy ${total} job nháp`,
    });
  } catch (error) {
    logger.error('Error getting draft jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách job nháp',
    });
  }
};

// @desc    Submit job for admin review (draft -> pending)
// @route   POST /api/jobs/employer/:id/submit
// @access  Private (Employer)
const submitJobForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }

    if (job.status !== JobStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gửi duyệt job ở trạng thái nháp',
      });
    }
    job.status = JobStatus.PUBLISHED;
    await job.save();
    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPost(job),
      message: 'Đã gửi duyệt. Vui lòng chờ admin phê duyệt',
    });
  } catch (error) {
    logger.error('Error submitting job for review:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi duyệt job' });
  }
};

module.exports = {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobApplications,
  getJobBySlug,
  incrementJobViews,
  getJobCompany,
  getJobStats,
  getRecentJobs,
  submitJobForReview,
  getEmployerJobs,
  getDraftJobs,
};
