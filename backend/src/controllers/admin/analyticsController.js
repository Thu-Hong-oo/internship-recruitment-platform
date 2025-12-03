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
  // Get period from query (default 30 days for charts)
  const { period = '30' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const [
    totalUsers,
    totalStudents,
    totalEmployers,
    totalJobs,
    totalApplications,
    pendingApplications,
    verifiedEmployers,
    activeJobs,
    rejectedApplications,
    acceptedApplications,
    pausedJobs,
    expiredJobs,
    newUsersToday,
    newJobsToday,
    newApplicationsToday,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'candidate' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments(),
    Application.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    EmployerProfile.countDocuments({ 'verification.isVerified': true }),
    Job.countDocuments({ status: 'active' }),
    Application.countDocuments({ status: 'rejected' }),
    Application.countDocuments({ status: 'accepted' }),
    Job.countDocuments({ status: 'paused' }),
    Job.countDocuments({ status: 'expired' }),
    User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    Job.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    Application.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
  ]);

  // Recent activities
  const recentUsers = await User.find()
    .select('email fullName role createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentJobs = await Job.find()
    .populate({
      path: 'employer',
      select: 'company.name company.logo.url company.industry verification.isVerified'
    })
    .select('title status createdAt level jobType')
    .sort({ createdAt: -1 })
    .limit(5);

    const recentApplications = await Application.find()
      .populate({
        path: 'candidateId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'email fullName'
        }
      })
      .populate('jobId', 'title')
      .select('status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

  // ============================================
  // CHART DATA - Dữ liệu cho biểu đồ
  // ============================================

  // 1. User Growth Trend (Biểu đồ tăng trưởng user theo ngày)
  const userGrowthTrend = await User.aggregate([
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

  // 2. Application Status Distribution (Biểu đồ phân bố trạng thái application)
  const applicationStatusDistribution = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // 3. Job Status Distribution (Biểu đồ phân bố trạng thái job)
  const jobStatusDistribution = await Job.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // 4. Applications Trend (Biểu đồ xu hướng applications theo ngày)
  const applicationsTrend = await Application.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // 5. Jobs Posted Trend (Biểu đồ jobs được đăng theo ngày)
  const jobsPostedTrend = await Job.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // 6. Top Industries (Top ngành nghề có nhiều jobs nhất)
  const topIndustries = await Job.aggregate([
    {
      $match: {
        industryCode: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$industryCode',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // 7. Top Skills (Top skills được yêu cầu nhiều nhất)
  const topSkills = await Job.aggregate([
    {
      $unwind: '$skills',
    },
    {
      $group: {
        _id: '$skills',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 15,
    },
  ]);

  // 8. Job Level Distribution (Phân bố level của jobs)
  const jobLevelDistribution = await Job.aggregate([
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 },
      },
    },
  ]);

  // 9. Job Type Distribution (Phân bố loại hình công việc)
  const jobTypeDistribution = await Job.aggregate([
    {
      $group: {
        _id: '$jobType',
        count: { $sum: 1 },
      },
    },
  ]);

  // 10. Application Success Rate by Job (Top jobs có tỷ lệ chấp nhận cao nhất)
  const applicationSuccessRate = await Application.aggregate([
    {
      $group: {
        _id: '$jobId',
        total: { $sum: 1 },
        accepted: {
          $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
        },
      },
    },
    {
      $match: {
        total: { $gte: 3 }, // Chỉ lấy jobs có ít nhất 3 applications
      },
    },
    {
      $project: {
        _id: 1,
        total: 1,
        accepted: 1,
        successRate: {
          $multiply: [{ $divide: ['$accepted', '$total'] }, 100],
        },
      },
    },
    {
      $sort: { successRate: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: 'jobs',
        localField: '_id',
        foreignField: '_id',
        as: 'job',
      },
    },
    {
      $unwind: '$job',
    },
    {
      $project: {
        jobTitle: '$job.title',
        total: 1,
        accepted: 1,
        successRate: 1,
      },
    },
  ]);

  // 11. Most Active Employers (Top employers đăng nhiều jobs nhất)
  const mostActiveEmployers = await Job.aggregate([
    {
      $group: {
        _id: '$employer',
        jobCount: { $sum: 1 },
        activeJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
      },
    },
    {
      $sort: { jobCount: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: 'employerprofiles',
        localField: '_id',
        foreignField: '_id',
        as: 'employer',
      },
    },
    {
      $unwind: '$employer',
    },
    {
      $project: {
        companyName: '$employer.company.name',
        jobCount: 1,
        activeJobs: 1,
        isVerified: '$employer.verification.isVerified',
      },
    },
  ]);

  // 12. User Activity Heatmap (Hoạt động user theo giờ trong ngày)
  const userActivityHeatmap = await User.aggregate([
    {
      $match: {
        lastLogin: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        hour: { $hour: '$lastLogin' },
        dayOfWeek: { $dayOfWeek: '$lastLogin' },
      },
    },
    {
      $group: {
        _id: {
          hour: '$hour',
          dayOfWeek: '$dayOfWeek',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 },
    },
  ]);

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
        rejectedApplications,
        acceptedApplications,
        pausedJobs,
        expiredJobs,
        newUsersToday,
        newJobsToday,
        newApplicationsToday,
      },
      recentActivities: {
        users: recentUsers,
        jobs: recentJobs,
        applications: recentApplications,
      },
      charts: {
        userGrowthTrend,
        applicationStatusDistribution,
        jobStatusDistribution,
        applicationsTrend,
        jobsPostedTrend,
        topIndustries,
        topSkills,
        jobLevelDistribution,
        jobTypeDistribution,
        applicationSuccessRate,
        mostActiveEmployers,
        userActivityHeatmap,
      },
      period: parseInt(period), // Thời gian lấy dữ liệu (ngày)
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

// @desc    Get job analytics
// @route   GET /api/admin/analytics/jobs
// @access  Private (Admin only)
const getJobAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Jobs posted over time
  const jobsOverTime = await Job.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // Jobs by industry
  const jobsByIndustry = await Job.aggregate([
    {
      $group: {
        _id: '$industryCode',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // Average applications per job
  const applicationsPerJob = await Application.aggregate([
    {
      $group: {
        _id: '$jobId',
        applicationCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        avgApplications: { $avg: '$applicationCount' },
        minApplications: { $min: '$applicationCount' },
        maxApplications: { $max: '$applicationCount' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      jobsOverTime,
      jobsByIndustry,
      applicationsPerJob: applicationsPerJob[0] || {
        avgApplications: 0,
        minApplications: 0,
        maxApplications: 0,
      },
      period: parseInt(period),
    },
  });
});

// @desc    Get application analytics
// @route   GET /api/admin/analytics/applications
// @access  Private (Admin only)
const getApplicationAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Applications over time by status
  const applicationsOverTime = await Application.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // Application response time (time from pending to accepted/rejected)
  const responseTimeStats = await Application.aggregate([
    {
      $match: {
        status: { $in: ['accepted', 'rejected'] },
        updatedAt: { $exists: true },
      },
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ['$updatedAt', '$createdAt'] },
            1000 * 60 * 60 * 24, // Convert to days
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
      },
    },
  ]);

  // Most applied jobs
  const mostAppliedJobs = await Application.aggregate([
    {
      $group: {
        _id: '$jobId',
        applicationCount: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        acceptedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
        },
      },
    },
    {
      $sort: { applicationCount: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: 'jobs',
        localField: '_id',
        foreignField: '_id',
        as: 'job',
      },
    },
    {
      $unwind: '$job',
    },
    {
      $project: {
        jobTitle: '$job.title',
        jobStatus: '$job.status',
        applicationCount: 1,
        pendingCount: 1,
        acceptedCount: 1,
        rejectedCount: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      applicationsOverTime,
      responseTimeStats: responseTimeStats[0] || {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
      },
      mostAppliedJobs,
      period: parseInt(period),
    },
  });
});

// @desc    Get employer analytics
// @route   GET /api/admin/analytics/employers
// @access  Private (Admin only)
const getEmployerAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Employer registration trend
  const employerRegistrations = await User.aggregate([
    {
      $match: {
        role: 'employer',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // Verification status
  const verificationStats = await EmployerProfile.aggregate([
    {
      $group: {
        _id: '$verification.isVerified',
        count: { $sum: 1 },
      },
    },
  ]);

  // Top employers by job count
  const topEmployersByJobs = await Job.aggregate([
    {
      $group: {
        _id: '$employer',
        totalJobs: { $sum: 1 },
        activeJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
      },
    },
    {
      $sort: { totalJobs: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: 'employerprofiles',
        localField: '_id',
        foreignField: '_id',
        as: 'employer',
      },
    },
    {
      $unwind: '$employer',
    },
    {
      $project: {
        companyName: '$employer.company.name',
        companyIndustry: '$employer.company.industry',
        totalJobs: 1,
        activeJobs: 1,
        isVerified: '$employer.verification.isVerified',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      employerRegistrations,
      verificationStats,
      topEmployersByJobs,
      period: parseInt(period),
    },
  });
});

// @desc    Get system health metrics
// @route   GET /api/admin/analytics/system
// @access  Private (Admin only)
const getSystemMetrics = asyncHandler(async (req, res) => {
  const CandidateProfile = require('../../models/CandidateProfile');
  const SavedJob = require('../../models/SavedJob');

  // Database collection sizes
  const [
    usersCount,
    candidateProfilesCount,
    employerProfilesCount,
    jobsCount,
    applicationsCount,
    savedJobsCount,
  ] = await Promise.all([
    User.countDocuments(),
    CandidateProfile.countDocuments(),
    EmployerProfile.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
    SavedJob.countDocuments(),
  ]);

  // Data quality metrics
  const [
    usersWithoutEmail,
    candidatesWithoutProfile,
    jobsWithoutSkills,
    incompleteApplications,
  ] = await Promise.all([
    User.countDocuments({ email: { $exists: false } }),
    User.countDocuments({
      role: 'candidate',
      candidateProfile: { $exists: false },
    }),
    Job.countDocuments({ skills: { $size: 0 } }),
    Application.countDocuments({ status: { $exists: false } }),
  ]);

  // Recent activity (last 24 hours)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    recentLogins,
    recentRegistrations,
    recentJobPosts,
    recentApplications,
  ] = await Promise.all([
    User.countDocuments({ lastLogin: { $gte: last24Hours } }),
    User.countDocuments({ createdAt: { $gte: last24Hours } }),
    Job.countDocuments({ createdAt: { $gte: last24Hours } }),
    Application.countDocuments({ createdAt: { $gte: last24Hours } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      collectionSizes: {
        users: usersCount,
        candidateProfiles: candidateProfilesCount,
        employerProfiles: employerProfilesCount,
        jobs: jobsCount,
        applications: applicationsCount,
        savedJobs: savedJobsCount,
      },
      dataQuality: {
        usersWithoutEmail,
        candidatesWithoutProfile,
        jobsWithoutSkills,
        incompleteApplications,
      },
      last24Hours: {
        logins: recentLogins,
        registrations: recentRegistrations,
        jobPosts: recentJobPosts,
        applications: recentApplications,
      },
    },
  });
});

module.exports = {
  getDashboardStats,
  getUserAnalytics,
  getJobAnalytics,
  getApplicationAnalytics,
  getEmployerAnalytics,
  getSystemMetrics,
};
