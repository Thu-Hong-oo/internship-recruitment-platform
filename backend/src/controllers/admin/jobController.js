const Job = require('../../models/Job');
const Application = require('../../models/Application');
const CandidateProfile = require('../../models/CandidateProfile');
const EmployerProfile = require('../../models/EmployerProfile');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../utils/logger');
const mongoose = require('mongoose');
const { JOB_STATUS } = require('../../constants/common.constants');

// ========================================
// JOB MODERATION & ADMINISTRATION
// ========================================

// @desc    Get all jobs with admin features
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
const getJobsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  // Build filter
  const filter = {};

  // Exclude draft and deleted jobs from admin view (employers manage drafts separately)
  filter.status = { $nin: [JOB_STATUS.DRAFT, JOB_STATUS.DELETED] };

  if (req.query.status) {
    // If specific status is requested, override the draft exclusion
    filter.status = req.query.status;
  }

  if (req.query.level) {
    filter.level = req.query.level;
  }

  if (req.query.jobType) {
    filter.jobType = req.query.jobType;
  }

  if (req.query.location) {
    filter.location = { $regex: req.query.location, $options: 'i' };
  }

  if (req.query.salaryMin) {
    filter['salary.min'] = { $gte: parseInt(req.query.salaryMin) };
  }

  if (req.query.salaryMax) {
    filter['salary.max'] = { $lte: parseInt(req.query.salaryMax) };
  }

  // Date filters
  if (req.query.dateFrom) {
    filter.createdAt = { $gte: new Date(req.query.dateFrom) };
  }

  if (req.query.dateTo) {
    filter.createdAt = {
      ...filter.createdAt,
      $lte: new Date(req.query.dateTo),
    };
  }

  // Search
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { 'company.name': searchRegex },
    ];
  }

  // Filter for jobs that need attention (no moderation fields yet)
  if (req.query.flagged === 'true') {
    filter.$or = [
      { status: JOB_STATUS.REJECTED },
      { deadline: { $lt: new Date() } }, // Past deadline
    ];
  }

  const total = await Job.countDocuments(filter);

  const jobs = await Job.find(filter)
    .populate({
      path: 'employer',
      select: 'company owner',
      populate: {
        path: 'owner',
        select: 'email fullName',
      },
    })
    .select(
      'title location salaryMin salaryMax currency status level jobType skills createdAt updatedAt views stats deadline positions'
    )
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Enhanced job data for admin view
  const jobsWithAnalytics = await Promise.all(
    jobs.map(async job => {
      const applications = await Application.countDocuments({ jobId: job._id });
      const activeApplications = await Application.countDocuments({
        jobId: job._id,
        status: { $in: ['pending', 'reviewing'] },
      });

      return {
        _id: job._id,
        title: job.title,
        company: job.employer?.company || null,
        employer: job.employer ? {
          _id: job.employer._id,
          name: job.employer.company?.name || 'Unknown Company',
          email: job.employer.owner?.email || null,
        } : null,
        location: job.location,
        salary: {
          min: job.salaryMin,
          max: job.salaryMax,
          currency: job.currency || 'VND'
        },
        level: job.level,
        jobType: job.jobType,
        status: job.status,
        skills: job.skills || [],
        deadline: job.deadline,
        positions: job.positions,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,

        // Analytics
        analytics: {
          applications: applications,
          activeApplications: activeApplications,
          views: job.views || 0,
          reports: 0, // No reports field in schema yet
        },

        // Basic info only (no moderation fields in schema)
        metadata: {
          isActive: job.status === JOB_STATUS.ACTIVE,
          hasDeadline: !!job.deadline,
          isPastDeadline: job.deadline && new Date() > job.deadline,
        },

        // Quick action indicators
        needsAttention: {
          hasReports: false, // No reports field yet
          hasFlags: false, // No moderation in schema yet
          lowApplications: applications < 5 && job.status === JOB_STATUS.ACTIVE,
          isPastDeadline: job.deadline && new Date() > job.deadline,
          isInactive:
            job.status === JOB_STATUS.PAUSED ||
            job.status === JOB_STATUS.CLOSED,
        },
      };
    })
  );

  const statusStats = await Job.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: startIndex + limit < total,
      hasPrevPage: startIndex > 0,
      total,
    },
    stats: {
      totalJobs: total,
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      needAttention: jobsWithAnalytics.filter(job =>
        Object.values(job.needsAttention).some(Boolean)
      ).length,
    },
    data: jobsWithAnalytics,
  });
});

// @desc    Get single job with full admin details
// @route   GET /api/admin/jobs/:id
// @access  Private (Admin only)
const getJobAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'ID không hợp lệ',
    });
  }

  const job = await Job.findById(id)
    .populate('employer', 'company owner verification')
    .populate({
      path: 'employer',
      populate: {
        path: 'owner',
        select: 'email fullName phone createdAt',
      },
    });

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy công việc',
    });
  }

  // Get detailed analytics
  const [applications, reports, views] = await Promise.all([
    Application.find({ jobId: job._id })
      .populate('candidateId', 'fullName email')
      .populate('candidateProfile', 'personalInfo')
      .select('status createdAt score'),
    // If you have a reports collection, otherwise empty array
    [],
    // View history if tracked
    job.viewCount || 0,
  ]);

  const applicationStats = applications.reduce(
    (acc, app) => {
      acc.total++;
      acc.byStatus[app.status] = (acc.byStatus[app.status] || 0) + 1;
      return acc;
    },
    { total: 0, byStatus: {} }
  );

  res.status(200).json({
    success: true,
    data: {
      // Basic job info
      job: {
        _id: job._id,
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        salary: job.salary,
        benefits: job.benefits,
        requirements: job.requirements,
        skills: job.skills,
        level: job.level,
        jobType: job.jobType,
        status: job.status,
        applicationDeadline: job.applicationDeadline,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },

      // Employer info
      employer: {
        _id: job.employer._id,
        company: job.employer.company,
        user: job.employer.owner,
        verification: job.employer.verification,
        isVerified: job.employer.verification?.isVerified || false,
      },

      // Analytics
      analytics: {
        applications: applicationStats,
        views: views,
        reports: reports.length,
        performance: {
          applicationRate: views > 0 ? (applications.length / views) * 100 : 0,
          avgScore:
            applications.length > 0
              ? applications.reduce((sum, app) => sum + (app.score || 0), 0) /
                applications.length
              : 0,
        },
      },

      // Admin management info (basic)
      management: {
        canEdit: true,
        canDelete: true,
        canChangeStatus: true,
        lastModified: job.updatedAt,
        postedBy: job.postedBy,
      },

      // Recent applications for quick review
      recentApplications: applications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(app => ({
          _id: app._id,
          candidate: {
            name: app.candidateId?.fullName,
            email: app.candidateId?.email,
          },
          status: app.status,
          score: app.score,
          appliedAt: app.createdAt,
        })),

      // No reports collection yet
      reports: [],
    },
  });
});

// @desc    Update job status (approve, reject, flag)
// @route   PUT /api/admin/jobs/:id/status
// @access  Private (Admin only)
const updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason, adminNote } = req.body;

  const validStatuses = [
    JOB_STATUS.ACTIVE,
    JOB_STATUS.PAUSED,
    JOB_STATUS.CLOSED,
    JOB_STATUS.FILLED,
    JOB_STATUS.REJECTED,
    // Also allow pending for admin approval workflow
    JOB_STATUS.PENDING,
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status không hợp lệ',
      validStatuses,
    });
  }

  const job = await Job.findById(id).populate('employer', 'owner');

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy công việc',
    });
  }

  const oldStatus = job.status;
  job.status = status;

  // Handle specific status changes
  if (status === JOB_STATUS.REJECTED && !reason) {
    return res.status(400).json({
      success: false,
      error: 'Phải cung cấp lý do từ chối',
    });
  }

  // For now, just log admin actions since no moderation schema exists
  if (adminNote) {
    logger.info(`Admin note: ${adminNote}`, {
      jobId: id,
      adminId: req.user.id,
      action: `Status changed from ${oldStatus} to ${status}`,
    });
  }

  await job.save();

  logger.info(`Admin updated job status: ${oldStatus} → ${status}`, {
    jobId: id,
    adminId: req.user.id,
    employerId: job.employer._id,
    reason,
  });

  res.status(200).json({
    success: true,
    message: `Đã cập nhật trạng thái công việc thành "${status}"`,
    data: {
      _id: job._id,
      title: job.title,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.id,
      updatedAt: new Date(),
    },
  });
});

// @desc    Delete job (admin only)
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin only)
const deleteJobAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, notifyEmployer = true } = req.body;

  const job = await Job.findById(id).populate('employer', 'owner');

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy công việc',
    });
  }

  // Count applications before deletion
  const applicationCount = await Application.countDocuments({ jobId: id });

  // Delete related applications if any
  if (applicationCount > 0) {
    await Application.deleteMany({ jobId: id });
    logger.info(`Deleted ${applicationCount} applications for job ${id}`);
  }

  await Job.findByIdAndDelete(id);

  logger.warn('Admin deleted job', {
    jobId: id,
    title: job.title,
    employerId: job.employer._id,
    applicationCount,
    adminId: req.user.id,
    reason,
  });

  res.status(200).json({
    success: true,
    message: 'Đã xóa công việc và các ứng tuyển liên quan',
    data: {
      deletedJob: {
        _id: job._id,
        title: job.title,
        employer: job.employer,
      },
      deletedApplications: applicationCount,
      deletedBy: req.user.id,
      reason,
    },
  });
});

// @desc    Get job applications for admin review
// @route   GET /api/admin/jobs/:id/applications
// @access  Private (Admin only)
const getJobApplicationsAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const filter = { jobId: id };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const total = await Application.countDocuments(filter);

  const applications = await Application.find(filter)
    .populate('candidateId', 'fullName email phone')
    .populate(
      'candidateProfile',
      'personalInfo education workExperience skills'
    )
    .populate('jobId', 'title company')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const statusStats = await Application.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: startIndex + limit < total,
      hasPrevPage: startIndex > 0,
      total,
    },
    stats: {
      totalApplications: total,
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    },
    data: applications.map(app => ({
      _id: app._id,
      candidate: {
        _id: app.candidateId._id,
        fullName: app.candidateId.fullName,
        email: app.candidateId.email,
        phone: app.candidateId.phone,
      },
      profile: {
        personalInfo: app.candidateProfile?.personalInfo,
        education: app.candidateProfile?.education?.slice(0, 2), // Latest 2
        experience: app.candidateProfile?.workExperience?.slice(0, 2), // Latest 2
        skills: app.candidateProfile?.skills?.slice(0, 10), // Top 10
      },
      status: app.status,
      score: app.score,
      coverLetter: app.coverLetter,
      appliedAt: app.createdAt,
      updatedAt: app.updatedAt,
    })),
  });
});

module.exports = {
  getJobsAdmin,
  getJobAdmin,
  updateJobStatus,
  deleteJobAdmin,
  getJobApplicationsAdmin,
};
