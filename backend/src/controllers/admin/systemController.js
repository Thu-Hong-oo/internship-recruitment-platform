const User = require('../../models/User');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const EmployerProfile = require('../../models/EmployerProfile');
const CandidateProfile = require('../../models/CandidateProfile');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ========================================
// SYSTEM HEALTH & MONITORING
// ========================================

// @desc    Get system health status
// @route   GET /api/admin/system/health
// @access  Private (Admin only)
const getSystemHealth = asyncHandler(async (req, res) => {
  const healthCheck = {
    timestamp: new Date(),
    status: 'healthy',
    services: {},
    metrics: {},
  };

  try {
    // Database connectivity check
    const dbStatus = mongoose.connection.readyState;
    healthCheck.services.database = {
      status: dbStatus === 1 ? 'connected' : 'disconnected',
      readyState: dbStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };

    // Database performance metrics
    const dbStats = await mongoose.connection.db.stats();
    healthCheck.services.database.stats = {
      collections: dbStats.collections,
      objects: dbStats.objects,
      dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`,
    };

    // Get collection counts for key models
    const [
      userCount,
      jobCount,
      applicationCount,
      employerCount,
      candidateCount,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      EmployerProfile.countDocuments(),
      CandidateProfile.countDocuments(),
    ]);

    healthCheck.metrics.collections = {
      users: userCount,
      jobs: jobCount,
      applications: applicationCount,
      employers: employerCount,
      candidates: candidateCount,
    };

    // System metrics
    const memoryUsage = process.memoryUsage();
    healthCheck.metrics.system = {
      nodeVersion: process.version,
      uptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
      memory: {
        used: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    };

    // Recent activity metrics (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentUsers, recentJobs, recentApplications] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: yesterday } }),
      Job.countDocuments({ createdAt: { $gte: yesterday } }),
      Application.countDocuments({ createdAt: { $gte: yesterday } }),
    ]);

    healthCheck.metrics.activity24h = {
      newUsers: recentUsers,
      newJobs: recentJobs,
      newApplications: recentApplications,
    };

    // Error rate analysis (if you have error tracking)
    const errorLogs = await getRecentErrors(24); // Helper function
    healthCheck.metrics.errors = {
      last24h: errorLogs.length,
      critical: errorLogs.filter(log => log.level === 'error').length,
    };

    // Overall health status
    if (dbStatus !== 1) {
      healthCheck.status = 'unhealthy';
    } else if (errorLogs.length > 100) {
      healthCheck.status = 'degraded';
    }

    res.status(200).json({
      success: true,
      data: healthCheck,
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date(),
    });
  }
});

// @desc    Get system logs
// @route   GET /api/admin/system/logs
// @access  Private (Admin only)
const getSystemLogs = asyncHandler(async (req, res) => {
  const {
    level = 'all',
    limit = 100,
    page = 1,
    startDate,
    endDate,
  } = req.query;

  try {
    // Read logs from file (adjust path based on your logger configuration)
    const logsPath = path.join(process.cwd(), 'logs');
    const combinedLogPath = path.join(logsPath, 'combined.log');
    const errorLogPath = path.join(logsPath, 'error.log');

    let logContent = '';

    // Read appropriate log file based on level
    if (level === 'error' && fs.existsSync(errorLogPath)) {
      logContent = fs.readFileSync(errorLogPath, 'utf8');
    } else if (fs.existsSync(combinedLogPath)) {
      logContent = fs.readFileSync(combinedLogPath, 'utf8');
    } else {
      return res.status(404).json({
        success: false,
        error: 'Log files not found',
      });
    }

    // Parse log entries
    const logLines = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          // Handle non-JSON log lines
          return {
            timestamp: new Date(),
            level: 'info',
            message: line,
            raw: true,
          };
        }
      });

    // Filter by date range if provided
    let filteredLogs = logLines;
    if (startDate || endDate) {
      filteredLogs = logLines.filter(log => {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Filter by level
    if (level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);

    // Log level statistics
    const levelStats = logLines.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit),
        hasNextPage: startIndex + limit < filteredLogs.length,
        hasPrevPage: startIndex > 0,
      },
      stats: {
        totalLogs: logLines.length,
        filteredLogs: filteredLogs.length,
        levelBreakdown: levelStats,
      },
      data: paginatedLogs,
    });
  } catch (error) {
    logger.error('Failed to read system logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to read system logs',
    });
  }
});

// @desc    Get admin dashboard overview
// @route   GET /api/admin/system/overview
// @access  Private (Admin only)
const getSystemOverview = asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;

  // Calculate date range based on period
  let startDate;
  switch (period) {
    case '24h':
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  // Get comprehensive statistics
  const [
    totalStats,
    recentStats,
    userGrowth,
    jobStats,
    applicationStats,
    systemHealth,
  ] = await Promise.all([
    // Total counts
    Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      EmployerProfile.countDocuments(),
      CandidateProfile.countDocuments(),
    ]).then(([users, jobs, applications, employers, candidates]) => ({
      users,
      jobs,
      applications,
      employers,
      candidates,
    })),

    // Recent activity
    Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Job.countDocuments({ createdAt: { $gte: startDate } }),
      Application.countDocuments({ createdAt: { $gte: startDate } }),
    ]).then(([users, jobs, applications]) => ({
      users,
      jobs,
      applications,
    })),

    // User growth by day
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Job statistics
    Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Application statistics
    Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Basic system health check
    checkBasicHealth(),
  ]);

  // Process user role distribution
  const userRoles = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  // Top performing jobs (by application count)
  const topJobs = await Job.aggregate([
    { $match: { status: 'active' } },
    {
      $lookup: {
        from: 'applications',
        localField: '_id',
        foreignField: 'jobId',
        as: 'applications',
      },
    },
    {
      $addFields: {
        applicationCount: { $size: '$applications' },
      },
    },
    {
      $project: {
        title: 1,
        company: 1,
        applicationCount: 1,
        createdAt: 1,
      },
    },
    { $sort: { applicationCount: -1 } },
    { $limit: 10 },
  ]);

  // Pending verifications count
  const pendingVerifications = await EmployerProfile.countDocuments({
    status: 'pending',
  });

  res.status(200).json({
    success: true,
    data: {
      period,
      timestamp: new Date(),

      // Summary stats
      summary: {
        total: totalStats,
        recent: recentStats,
        pendingVerifications,
      },

      // Growth trends
      trends: {
        userGrowth: userGrowth.map(item => ({
          date: item._id,
          count: item.count,
        })),
      },

      // Distribution stats
      distribution: {
        userRoles: userRoles.reduce((acc, role) => {
          acc[role._id] = role.count;
          return acc;
        }, {}),
        jobStatus: jobStats.reduce((acc, status) => {
          acc[status._id] = status.count;
          return acc;
        }, {}),
        applicationStatus: applicationStats.reduce((acc, status) => {
          acc[status._id] = status.count;
          return acc;
        }, {}),
      },

      // Top performing content
      topPerformers: {
        jobs: topJobs,
      },

      // System status
      system: systemHealth,

      // Quick actions needed
      actionItems: {
        pendingVerifications,
        flaggedJobs: await Job.countDocuments({ status: 'flagged' }),
        suspendedUsers: await User.countDocuments({ status: 'suspended' }),
      },
    },
  });
});

// @desc    Update system settings
// @route   PUT /api/admin/system/settings
// @access  Private (Admin only)
const updateSystemSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  // Here you would typically save settings to a configuration collection
  // For now, we'll just validate and return the settings
  const allowedSettings = [
    'maintenanceMode',
    'registrationEnabled',
    'jobPostingEnabled',
    'maxFileSize',
    'supportedFileTypes',
    'emailNotifications',
  ];

  const validSettings = {};
  Object.keys(settings).forEach(key => {
    if (allowedSettings.includes(key)) {
      validSettings[key] = settings[key];
    }
  });

  // In a real implementation, you'd save these to a database
  logger.info('System settings updated', {
    adminId: req.user.id,
    settings: validSettings,
  });

  res.status(200).json({
    success: true,
    message: 'Cài đặt hệ thống đã được cập nhật',
    data: validSettings,
  });
});

// Helper Functions

const getRecentErrors = async hours => {
  try {
    const errorLogPath = path.join(process.cwd(), 'logs', 'error.log');
    if (!fs.existsSync(errorLogPath)) return [];

    const content = fs.readFileSync(errorLogPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log && new Date(log.timestamp) > cutoffTime);
  } catch (error) {
    logger.error('Failed to read error logs', { error: error.message });
    return [];
  }
};

const checkBasicHealth = async () => {
  try {
    const health = {
      database: mongoose.connection.readyState === 1,
      memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024, // < 1GB
      uptime: process.uptime() > 0,
    };

    return {
      status: Object.values(health).every(Boolean) ? 'healthy' : 'degraded',
      checks: health,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

module.exports = {
  getSystemHealth,
  getSystemLogs,
  getSystemOverview,
  updateSystemSettings,
};
