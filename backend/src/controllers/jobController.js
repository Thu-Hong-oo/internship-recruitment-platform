const Job = require('../models/Job');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const { logger } = require('../utils/logger');

// @desc    Get all jobs with filtering and pagination (supports text search)
// @route   GET /api/jobs
// @access  Public
const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      q, // Text search query
      location,
      skills,
      employer,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;


    const query = {};
    if (q) {
      query.$text = { $search: q };
    }
    if (location) {
      query['location'] = { $regex: location, $options: 'i' };
    }
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query['skills'] = { $in: skillArray };
    }
    if (employer) {
      query['employer'] = employer;
    }
    if (status) {
      query['status'] = status;
    }

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate('employer', 'name logo industry description')
      .populate('postedBy', 'fullName name email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        appliedFilters: Object.keys(query).length,
        searchQuery: q || null,
        availableFilters: {
          location: !!location,
          skills: !!skills,
          employer: !!employer,
          status: !!status,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc',
    });
  }
};


// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name logo industry description')
      .populate('postedBy', 'fullName name email avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const jobObj = job.toObject();
    if (jobObj.postedBy) {
      const pb = jobObj.postedBy;
      const computedFullName =
        pb.fullName ||
        pb.name ||
        (pb.profile && `${pb.profile.firstName || ''} ${pb.profile.lastName || ''}`.trim()) ||
        (pb.googleProfile && pb.googleProfile.name) ||
        pb.email?.split('@')[0] ||
        'Chưa cập nhật';
      jobObj.postedBy = {
        ...pb,
        fullName: computedFullName,
      };
    }

    res.status(200).json({
      success: true,
      data: jobObj,
    });
  } catch (error) {
    logger.error('Error getting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công việc',
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
const createJob = async (req, res) => {
  try {
    const jobData = req.body;
    jobData.employer = req.body.employer; // phải truyền employer từ client
    jobData.postedBy = req.user.id;
    if (req.user.role !== 'admin') {
      jobData.status = 'draft';
    }

    // Kiểm tra trạng thái xác thực của employer
    const EmployerProfile = require('../models/EmployerProfile');
    const employerProfile = await EmployerProfile.findById(jobData.employer);
    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }
    if (!employerProfile.verification?.isVerified && employerProfile.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản employer chưa xác thực, không thể tạo job mới. Vui lòng hoàn thành xác thực doanh nghiệp.',
      });
    }

    const job = await Job.create(jobData);
    await job.populate('employer', 'name logo industry description');
    await job.populate('postedBy', 'fullName name email avatar');

    res.status(201).json({
      success: true,
      data: job,
      message:
        job.status === 'open'
          ? 'Đăng job thành công'
          : 'Tạo job thành công, chờ admin duyệt',
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công việc',
      error: error.message,
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const updateData = req.body;
    if (updateData.status && req.user.role !== 'admin') {
      delete updateData.status;
    }
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('employer', 'name logo industry description')
      .populate('postedBy', 'fullName name email avatar');

    res.status(200).json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật công việc',
      error: error.message,
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    await job.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Xóa công việc thành công',
    });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công việc',
    });
  }
};

// @desc    Apply for job
// @route   POST /api/jobs/:id/apply
// @access  Private (Candidate)
const applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverLetter, resumeUrl, portfolioUrl } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId: id,
      candidateId: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã ứng tuyển cho công việc này',
      });
    }

    // Check application deadline
    if (job.application.deadline && new Date() > job.application.deadline) {
      return res.status(400).json({
        success: false,
        message: 'Đã hết hạn ứng tuyển',
      });
    }

    const application = await Application.create({
      jobId: id,
      candidateId: req.user.id,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      status: 'pending',
    });

    // Update job stats
    await Job.findByIdAndUpdate(id, {
      $inc: { 'stats.applications': 1 },
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi ứng tuyển',
    });
  }
};

// @desc    Get job applications
// @route   GET /api/jobs/:id/applications
// @access  Private (Employer)
const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc',
      });
    }

    const query = { jobId: id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .populate('candidateId', 'name email avatar')
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

    const job = await Job.findOne({ slug, status: 'open' })
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
      data: job,
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

    const query = { status: 'open' };
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('employer', 'name logo industry description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.status(200).json({
      success: true,
      data: jobs,
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

// @desc    Submit job for admin review (draft -> pending)
// @route   POST /api/jobs/employer/:id/submit
// @access  Private (Employer)
const submitJobForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });
    }

    if (job.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể gửi duyệt job ở trạng thái draft' });
    }
    job.status = 'open';
    await job.save();
    res.status(200).json({ success: true, data: job, message: 'Đã gửi duyệt. Vui lòng chờ admin phê duyệt' });
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
  applyForJob,
  getJobApplications,
  getJobBySlug,
  incrementJobViews,
  getJobCompany,
  getJobStats,
  getRecentJobs,
  submitJobForReview,
};
