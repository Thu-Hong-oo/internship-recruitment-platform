const User = require('../../models/User');
const EmployerProfile = require('../../models/EmployerProfile');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const asyncHandler = require('express-async-handler');

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
    User.countDocuments({ role: 'candidate' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments(),
    Application.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    EmployerProfile.countDocuments({ 'verification.isVerified': true }),
    Job.countDocuments({ status: 'active' }),
  ]);

  // Recent activities
  const recentUsers = await User.find()
    .select('email fullName role createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentJobs = await Job.find()
    .select('title company status createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentApplications = await Application.find()
    .populate('userId', 'email fullName')
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

module.exports = {
  getDashboardStats,
  getUserAnalytics,
};
