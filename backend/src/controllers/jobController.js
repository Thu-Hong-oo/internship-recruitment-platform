const Job = require('../models/Job');
const Industry = require('../models/Industry');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const { logger } = require('../utils/logger');
const {
  JOB_STATUS,
  EMPLOYER_PROFILE_STATUS,
  APPLICATION_STATUS,
} = require('../constants/common.constants');

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
      jobType,
      industry, // legacy string filter
      industryCode, // new normalized filter (root or leaf)
      subIndustryCode, // new leaf filter
      includeDescendants = 'true', // include children via industryPath
      category,
      salaryMin,
      salaryMax,
      createdFrom,
      createdTo,
      deadlineFrom,
      deadlineTo,
      tags,
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
    } else if (req.user?.role !== 'admin') {
      // Public users chỉ thấy jobs đang mở/active
      query['status'] = { $in: [JOB_STATUS.OPEN, JOB_STATUS.ACTIVE] };
    } else {
      // Admin có thể thấy tất cả trừ deleted (trừ khi explicitly request)
      if (req.query.includeDeleted !== 'true') {
        query['status'] = { $ne: JOB_STATUS.DELETED };
      }
    }
    if (jobType) {
      query['jobType'] = jobType;
    }
    // New normalized industry filters
    if (subIndustryCode) {
      query['subIndustryCode'] = subIndustryCode;
    } else if (industryCode) {
      if (includeDescendants !== 'false') {
        // Use industryPath array contains to include children without extra queries
        query['industryPath'] = industryCode;
      } else {
        query['industryCode'] = industryCode;
      }
    } else if (industry) {
      // Backward-compatibility: legacy string filter
      query['industry'] = { $regex: industry, $options: 'i' };
    }
    if (category) {
      query['category'] = { $regex: category, $options: 'i' };
    }
    if (salaryMin || salaryMax) {
      query['salaryMin'] = salaryMin ? { $gte: Number(salaryMin) } : undefined;
      query['salaryMax'] = salaryMax ? { $lte: Number(salaryMax) } : undefined;
    }
    if (createdFrom || createdTo) {
      query['createdAt'] = {};
      if (createdFrom) query['createdAt'].$gte = new Date(createdFrom);
      if (createdTo) query['createdAt'].$lte = new Date(createdTo);
    }
    if (deadlineFrom || deadlineTo) {
      query['deadline'] = {};
      if (deadlineFrom) query['deadline'].$gte = new Date(deadlineFrom);
      if (deadlineTo) query['deadline'].$lte = new Date(deadlineTo);
    }
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query['tags'] = { $in: tagArray };
    }
    // Xóa các filter undefined
    Object.keys(query).forEach(key => {
      if (
        query[key] === undefined ||
        (typeof query[key] === 'object' && Object.keys(query[key]).length === 0)
      ) {
        delete query[key];
      }
    });

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate(
        'employer',
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress'
      )
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
          jobType: !!jobType,
          industry: !!industry,
          category: !!category,
          salaryMin: !!salaryMin,
          salaryMax: !!salaryMax,
          createdFrom: !!createdFrom,
          createdTo: !!createdTo,
          deadlineFrom: !!deadlineFrom,
          deadlineTo: !!deadlineTo,
          tags: !!tags,
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
        (pb.profile &&
          `${pb.profile.firstName || ''} ${
            pb.profile.lastName || ''
          }`.trim()) ||
        (pb.googleProfile && pb.googleProfile.name) ||
        pb.email?.split('@')[0] ||
        'Chưa cập nhật';
      jobObj.postedBy = {
        ...pb,
        fullName: computedFullName,
      };
    }

    // Check if current user has applied for this job (if user is authenticated)
    let hasApplied = false;
    if (req.user && req.user.role === 'candidate') {
      const candidateProfile = await CandidateProfile.findOne({
        userId: req.user.id,
      });
      if (candidateProfile) {
        const application = await Application.findOne({
          jobId: job._id,
          candidateId: candidateProfile._id,
        });
        hasApplied = !!application;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...jobObj,
        hasApplied,
      },
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
    // Tìm employer profile theo owner là user đang đăng nhập
    const EmployerProfile = require('../models/EmployerProfile');
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });
    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hồ sơ employer',
      });
    }
    if (
      !employerProfile.verification?.isVerified &&
      employerProfile.status !== EMPLOYER_PROFILE_STATUS.VERIFIED
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Tài khoản employer chưa xác thực, không thể tạo job mới. Vui lòng hoàn thành xác thực doanh nghiệp.',
      });
    }
    jobData.employer = employerProfile._id;
    jobData.postedBy = req.user.id;
    // Luôn tạo job ở trạng thái 'draft' (bản nháp)
    jobData.status = JOB_STATUS.DRAFT;

    const job = await Job.create(jobData);
    await job.populate('employer', 'name logo industry description');
    await job.populate('postedBy', 'fullName name email avatar');

    res.status(201).json({
      success: true,
      data: job,
      message:
        job.status === JOB_STATUS.OPEN || job.status === JOB_STATUS.ACTIVE
          ? 'Đăng job thành công'
          : 'Tạo job thành công, đang ở trạng thái nháp',
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
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }
    // Chỉ employer tạo job hoặc admin mới được sửa
    if (
      req.user.role !== 'admin' &&
      String(job.postedBy) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Bạn không có quyền sửa job này' });
    }
    const updateData = req.body;
    // Chỉ admin mới được đổi status
    if (updateData.status && req.user.role !== 'admin') {
      delete updateData.status;
    }
    // Ensure status is always a valid JOB_STATUS value if present
    if (updateData.status && req.user.role === 'admin') {
      if (!Object.values(JOB_STATUS).includes(updateData.status)) {
        return res
          .status(400)
          .json({ success: false, message: 'Trạng thái job không hợp lệ' });
      }
    }
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('employer', 'name logo industry description')
      .populate('postedBy', 'fullName name email avatar');
    res.status(200).json({ success: true, data: updatedJob });
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
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công việc' });
    }
    // Nếu job đã bị xóa rồi thì không cho xóa lại nữa
    if (job.status === JOB_STATUS.DELETED) {
      return res
        .status(400)
        .json({ success: false, message: 'Công việc đã bị xóa trước đó' });
    }
    // Chỉ admin, người đăng job, chủ employer, hoặc thành viên có quyền mới được xóa
    let canDelete = false;
    if (req.user.role === 'admin') {
      canDelete = true;
    } else if (String(job.postedBy) === String(req.user.id)) {
      canDelete = true;
    } else {
      // Kiểm tra chủ employer hoặc thành viên có quyền
      const EmployerProfile = require('../models/EmployerProfile');
      const employerProfile = await EmployerProfile.findById(job.employer);
      if (employerProfile) {
        if (String(employerProfile.owner) === String(req.user.id)) {
          canDelete = true;
        } else if (Array.isArray(employerProfile.members)) {
          const member = employerProfile.members.find(
            m =>
              String(m.user) === String(req.user.id) &&
              m.permissions?.canPostJobs
          );
          if (member) {
            canDelete = true;
          }
        }
      }
    }
    if (!canDelete) {
      return res
        .status(403)
        .json({ success: false, message: 'Bạn không có quyền xóa job này' });
    }
    // Soft delete: chuyển trạng thái sang DELETED với metadata
    job.status = JOB_STATUS.DELETED;
    job.deletedAt = new Date();
    job.deletedBy = req.user.id;
    await job.save();
    res
      .status(200)
      .json({ success: true, message: 'Đã xóa công việc thành công' });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công việc',
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

    const job = await Job.findOne({ slug, status: JOB_STATUS.OPEN })
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

    const query = { status: JOB_STATUS.OPEN };
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
    const EmployerProfile = require('../models/EmployerProfile');
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
        query.status = { $ne: JOB_STATUS.DELETED };
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
      statusMatchQuery.status = { $ne: JOB_STATUS.DELETED };
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
      data: jobs,
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
    const EmployerProfile = require('../models/EmployerProfile');
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
      status: JOB_STATUS.DRAFT,
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
      data: jobs,
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

    if (job.status !== JOB_STATUS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gửi duyệt job ở trạng thái nháp',
      });
    }
    job.status = JOB_STATUS.PENDING;
    await job.save();
    res.status(200).json({
      success: true,
      data: job,
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
