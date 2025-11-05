const User = require('../models/User');
const Job = require('../models/JobPost');
const Application = require('../models/Application');
const IAdminRepository = require('../../application/admin/repositories/IAdminRepository');

/**
 * AdminRepository
 * Infrastructure layer implementation of IAdminRepository
 */
class AdminRepository extends IAdminRepository {
  async getSystemDashboard() {
    // Get basic statistics
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();

    // Get recent activities (simplified)
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt');

    const recentApplications = await Application.find()
      .populate('candidateId', 'fullName')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status createdAt');

    return {
      statistics: {
        totalUsers,
        totalJobs,
        totalApplications,
      },
      recentActivities: {
        jobs: recentJobs,
        applications: recentApplications,
      },
    };
  }

  async getAllUsers(options = {}) {
    const { page = 1, limit = 10, role, status } = options;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId) {
    return await User.findById(userId);
  }

  async updateUserById(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async deleteUserById(userId) {
    const result = await User.findByIdAndDelete(userId);
    return !!result;
  }

  async getAllJobs(options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('employer', 'company.name')
      .populate('postedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    return {
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateJobStatus(jobId, status) {
    return await Job.findByIdAndUpdate(jobId, { status }, { new: true });
  }

  async getSystemStats() {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();

    const jobsByStatus = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    return {
      totalUsers,
      totalJobs,
      totalApplications,
      jobsByStatus,
      usersByRole,
    };
  }

  async getRecentActivities(limit = 10) {
    // Get recent jobs
    const recentJobs = await Job.find()
      .populate('postedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title status createdAt postedBy');

    // Get recent applications
    const recentApplications = await Application.find()
      .populate('candidateId', 'fullName')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('status createdAt candidateId jobId');

    return {
      jobs: recentJobs,
      applications: recentApplications,
    };
  }

  async getSystemLogs(options = {}) {
    // This would typically read from log files or a logging service
    // For now, return a mock response
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    // Mock logs - in a real implementation, this would read from log files
    const mockLogs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'System started successfully',
        service: 'internship-ai-platform',
      },
      {
        timestamp: new Date(Date.now() - 1000),
        level: 'info',
        message: 'Database connected',
        service: 'internship-ai-platform',
      },
      {
        timestamp: new Date(Date.now() - 2000),
        level: 'info',
        message: 'Redis connected',
        service: 'internship-ai-platform',
      },
    ];

    return {
      logs: mockLogs.slice(skip, skip + limit),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockLogs.length,
        pages: Math.ceil(mockLogs.length / limit),
      },
    };
  }

  async getSystemHealth() {
    // Mock system health check
    return {
      health: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date(),
      },
    };
  }

  async getQueueStatus() {
    // Mock queue status - in a real implementation, this would check actual queues
    return {
      queues: [
        { name: 'email-queue', status: 'active', pending: 0, processing: 0 },
        {
          name: 'notification-queue',
          status: 'active',
          pending: 2,
          processing: 1,
        },
        {
          name: 'ai-processing-queue',
          status: 'active',
          pending: 5,
          processing: 2,
        },
      ],
    };
  }

  async clearQueue(queueName) {
    // Mock queue clearing - in a real implementation, this would clear the actual queue
    return {
      message: `Queue ${queueName} cleared successfully`,
    };
  }

  async getSystemSettings() {
    // Mock system settings - in a real implementation, this would read from a config store
    return {
      settings: {
        maintenanceMode: false,
        emailNotifications: true,
        aiMatchingEnabled: true,
        maxFileSize: '10MB',
        supportedFormats: ['pdf', 'doc', 'docx'],
      },
    };
  }

  async updateSystemSettings(settingsData) {
    // Mock settings update - in a real implementation, this would persist to a config store
    return {
      message: 'System settings updated successfully',
      settings: settingsData,
    };
  }

  async sendSystemNotification(notificationData) {
    // Mock notification sending - in a real implementation, this would send actual notifications
    return {
      message: 'System notification sent successfully',
      notification: {
        id: Date.now().toString(),
        ...notificationData,
        sentAt: new Date(),
      },
    };
  }

  async getSystemReports(options = {}) {
    // Mock system reports - in a real implementation, this would generate actual reports
    return {
      reports: [
        {
          id: 'user-activity-report',
          name: 'User Activity Report',
          type: 'activity',
          generatedAt: new Date(),
          data: {
            totalUsers: 150,
            activeUsers: 89,
            newUsersThisMonth: 23,
          },
        },
        {
          id: 'job-posting-report',
          name: 'Job Posting Report',
          type: 'jobs',
          generatedAt: new Date(),
          data: {
            totalJobs: 45,
            activeJobs: 32,
            applicationsReceived: 156,
          },
        },
      ],
    };
  }
}

module.exports = AdminRepository;
