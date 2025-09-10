const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// ========================================
// USER MANAGEMENT
// ========================================

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const filter = {};

  // Filter by role
  if (req.query.role) {
    filter.role = req.query.role;
  }

  // Filter by status
  if (req.query.status) {
    filter.isActive = req.query.status === 'active';
  }

  // Filter by email verification
  if (req.query.emailVerified) {
    filter.isEmailVerified = req.query.emailVerified === 'true';
  }

  // Search by email or name
  if (req.query.search) {
    filter.$or = [
      { email: { $regex: req.query.search, $options: 'i' } },
      { 'profile.firstName': { $regex: req.query.search, $options: 'i' } },
      { 'profile.lastName': { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .populate('candidateProfile', 'education experience skills')
    .populate('employerProfile', 'company position verification')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);

  // Pagination
  const endIndex = startIndex + limit;
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination,
    data: users,
  });
});

// @desc    Get single user (admin only)
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('candidateProfile')
    .populate('employerProfile');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Create user (admin only)
// @route   POST /api/admin/users
// @access  Private (Admin only)
const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  logger.info(`Admin created user: ${user.email}`, {
    adminId: req.user.id,
    userId: user._id,
  });

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  logger.info(`Admin updated user: ${user.email}`, {
    adminId: req.user.id,
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  // Check if user has active applications
  const activeApplications = await Application.find({
    userId: user._id,
    status: { $in: ['pending', 'reviewing', 'interviewing'] },
  });

  if (activeApplications.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Không thể xóa user có applications đang active',
    });
  }

  await user.remove();

  logger.info(`Admin deleted user: ${user.email}`, {
    adminId: req.user.id,
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update user status (admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Trạng thái không hợp lệ',
    });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: status === 'active' },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  logger.info(`Admin updated user status: ${user.email} -> ${status}`, {
    adminId: req.user.id,
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// ========================================
// ANALYTICS & DASHBOARD
// ========================================

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalEmployers,
    totalJobs,
    totalApplications,
    pendingApplications,
    verifiedEmployers,
    activeJobs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments(),
    Application.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    EmployerProfile.countDocuments({ 'verification.isVerified': true }),
    Job.countDocuments({ status: 'active' }),
  ]);

  // Recent activities
  const recentUsers = await User.find()
    .select('email profile.firstName profile.lastName role createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentJobs = await Job.find()
    .select('title company status createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentApplications = await Application.find()
    .populate('userId', 'email profile.firstName profile.lastName')
    .populate('jobId', 'title')
    .select('status createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalStudents,
        totalEmployers,
        totalJobs,
        totalApplications,
        pendingApplications,
        verifiedEmployers,
        activeJobs,
      },
      recentActivities: {
        users: recentUsers,
        jobs: recentJobs,
        applications: recentApplications,
      },
    },
  });
});

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private (Admin only)
const getUserAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // User registration trends
  const userRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          role: '$role',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // Role distribution
  const roleDistribution = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  // Email verification rate
  const emailVerificationStats = await User.aggregate([
    {
      $group: {
        _id: '$isEmailVerified',
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      userRegistrations,
      roleDistribution,
      emailVerificationStats,
    },
  });
});

// ========================================
// EMPLOYER VERIFICATION
// ========================================

// @desc    Get pending employer verifications
// @route   GET /api/admin/verifications
// @access  Private (Admin only)
const getPendingVerifications = asyncHandler(async (req, res) => {
  const pendingVerifications = await EmployerProfile.find({
    'verification.isVerified': false,
    status: 'pending',
  })
    .populate('userId', 'email profile.firstName profile.lastName')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: pendingVerifications.length,
    data: pendingVerifications,
  });
});

// ========================================
// COMPANY MODERATION
// ========================================

// @desc    Update company status (admin only)
// @route   PUT /api/admin/companies/:id/status
// @access  Private (Admin only)
const updateCompanyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' | 'pending' | 'suspended' | 'inactive'

  const allowed = ['active', 'pending', 'suspended', 'inactive'];
  if (!allowed.includes(status)) {
    return res
      .status(400)
      .json({ success: false, error: 'Trạng thái công ty không hợp lệ' });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, error: 'Company ID không hợp lệ' });
  }

  const company = await Company.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!company) {
    return res
      .status(404)
      .json({ success: false, error: 'Không tìm thấy công ty' });
  }

  logger.info('Admin updated company status', {
    adminId: req.user.id,
    companyId: id,
    status,
  });
  res.status(200).json({
    success: true,
    data: company,
    message: 'Cập nhật trạng thái công ty thành công',
  });
});

// @desc    Verify employer
// @route   PUT /api/admin/verifications/:id
// @access  Private (Admin only)
const verifyEmployer = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // action: 'approve' or 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Action không hợp lệ',
    });
  }

  const employerProfile = await EmployerProfile.findById(
    req.params.id
  ).populate('userId', 'email');

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile',
    });
  }

  if (action === 'approve') {
    employerProfile.verification.isVerified = true;
    employerProfile.verification.verifiedAt = new Date();
    employerProfile.verification.verifiedBy = req.user.id;
    employerProfile.status = 'active';
  } else {
    employerProfile.status = 'rejected';
    employerProfile.verification.rejectionReason = reason;
  }

  await employerProfile.save();

  logger.info(`Admin ${action}ed employer: ${employerProfile.userId.email}`, {
    adminId: req.user.id,
    employerId: employerProfile._id,
    reason,
  });

  res.status(200).json({
    success: true,
    data: employerProfile,
  });
});

// ========================================
// SYSTEM MANAGEMENT
// ========================================

// @desc    Get system health
// @route   GET /api/admin/system/health
// @access  Private (Admin only)
const getSystemHealth = asyncHandler(async (req, res) => {
  const health = {
    database: 'healthy',
    redis: 'healthy',
    email: 'healthy',
    storage: 'healthy',
    timestamp: new Date(),
  };

  // Check database connection
  try {
    await User.findOne();
  } catch (error) {
    health.database = 'unhealthy';
  }

  // Check Redis connection (if available)
  if (global.redisClient) {
    try {
      await global.redisClient.ping();
    } catch (error) {
      health.redis = 'unhealthy';
    }
  }

  res.status(200).json({
    success: true,
    data: health,
  });
});

// @desc    Get system logs
// @route   GET /api/admin/system/logs
// @access  Private (Admin only)
const getSystemLogs = asyncHandler(async (req, res) => {
  const { level = 'error', limit = 100 } = req.query;

  // This would typically read from log files or log database
  // For now, return a placeholder
  res.status(200).json({
    success: true,
    data: {
      message: 'Log retrieval not implemented yet',
      level,
      limit: parseInt(limit),
    },
  });
});

module.exports = {
  // User Management
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,

  // Analytics & Dashboard
  getDashboardStats,
  getUserAnalytics,

  // Employer Verification
  getPendingVerifications,
  verifyEmployer,
  updateCompanyStatus,

  // System Management
  getSystemHealth,
  getSystemLogs,
};
