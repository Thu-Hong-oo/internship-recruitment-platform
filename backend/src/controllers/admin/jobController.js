const Job = require('../../models/Job');
const Application = require('../../models/Application');
const CandidateProfile = require('../../models/CandidateProfile');
const EmployerProfile = require('../../models/EmployerProfile');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../utils/logger');
const mongoose = require('mongoose');

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

  if (req.query.status) {
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

  // Flagged or problematic jobs filter
  if (req.query.flagged === 'true') {
    filter.$or = [
      { reportCount: { $gt: 0 } },
      { status: 'flagged' },
      { 'moderation.flags.0': { $exists: true } },
    ];
  }

  const total = await Job.countDocuments(filter);

  const jobs = await Job.find(filter)
    .populate('employerId', 'company.name mainUserId')
    .populate({
      path: 'employerId',
      populate: {
        path: 'mainUserId',
        select: 'email fullName',
      },
    })
    .populate('skills', 'name category')
    .select(
      'title company location salary status level jobType createdAt updatedAt applicationCount viewCount reportCount moderation'
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
        company: job.company,
        employer: {
          _id: job.employerId._id,
          name: job.employerId?.company?.name || 'Unknown Company',
          email: job.employerId?.mainUserId?.email,
        },
        location: job.location,
        salary: job.salary,
        level: job.level,
        jobType: job.jobType,
        status: job.status,
        skills: job.skills,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,

        // Analytics
        analytics: {
          applications: applications,
          activeApplications: activeApplications,
          views: job.viewCount || 0,
          reports: job.reportCount || 0,
        },

        // Moderation info
        moderation: {
          flags: job.moderation?.flags || [],
          flagCount: job.moderation?.flags?.length || 0,
          isModerated: !!job.moderation?.moderatedBy,
          moderatedAt: job.moderation?.moderatedAt,
          notes: job.moderation?.adminNotes?.length || 0,
        },

        // Quick action indicators
        needsAttention: {
          hasReports: job.reportCount > 0,
          hasFlags: job.moderation?.flags?.length > 0,
          lowApplications: applications < 5 && job.status === 'active',
          expired: job.status === 'expired',
          flagged: job.status === 'flagged',
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
    .populate('employerId', 'company mainUserId verification')
    .populate({
      path: 'employerId',
      populate: {
        path: 'mainUserId',
        select: 'email fullName phone createdAt',
      },
    })
    .populate('skills', 'name category')
    .populate('moderation.moderatedBy', 'fullName email')
    .populate('moderation.adminNotes.addedBy', 'fullName email');

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
        _id: job.employerId._id,
        company: job.employerId.company,
        user: job.employerId.mainUserId,
        verification: job.employerId.verification,
        isVerified: job.employerId.verification?.isVerified || false,
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

      // Moderation details
      moderation: {
        flags: job.moderation?.flags || [],
        isModerated: !!job.moderation?.moderatedBy,
        moderatedBy: job.moderation?.moderatedBy,
        moderatedAt: job.moderation?.moderatedAt,
        adminNotes: job.moderation?.adminNotes || [],
        autoFlags: job.moderation?.autoFlags || [],
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

      // Reports if any
      reports: reports,
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
    'active',
    'inactive',
    'expired',
    'flagged',
    'rejected',
    'approved',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status không hợp lệ',
      validStatuses,
    });
  }

  const job = await Job.findById(id).populate('employerId', 'mainUserId');

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy công việc',
    });
  }

  const oldStatus = job.status;
  job.status = status;

  // Initialize moderation if not exists
  if (!job.moderation) {
    job.moderation = {
      flags: [],
      adminNotes: [],
      autoFlags: [],
    };
  }

  // Add admin note if provided
  if (adminNote) {
    job.moderation.adminNotes.push({
      note: adminNote,
      addedBy: req.user.id,
      addedAt: new Date(),
      action: `Status changed from ${oldStatus} to ${status}`,
    });
  }

  // Set moderation info
  job.moderation.moderatedBy = req.user.id;
  job.moderation.moderatedAt = new Date();

  // Handle specific status changes
  if (status === 'rejected' && !reason) {
    return res.status(400).json({
      success: false,
      error: 'Phải cung cấp lý do từ chối',
    });
  }

  if (status === 'rejected') {
    job.moderation.rejectionReason = reason;
  }

  if (status === 'flagged') {
    job.moderation.flags.push({
      reason: reason || 'Flagged by admin',
      flaggedBy: req.user.id,
      flaggedAt: new Date(),
      type: 'admin',
    });
  }

  await job.save();

  logger.info(`Admin updated job status: ${oldStatus} → ${status}`, {
    jobId: id,
    adminId: req.user.id,
    employerId: job.employerId._id,
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
      moderatedBy: req.user.id,
      moderatedAt: job.moderation.moderatedAt,
    },
  });
});

// @desc    Delete job (admin only)
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin only)
const deleteJobAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, notifyEmployer = true } = req.body;

  const job = await Job.findById(id).populate('employerId', 'mainUserId');

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
    employerId: job.employerId._id,
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
        employer: job.employerId,
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
