const UserRepository = require('../../repositories/UserRepository');
const JobRepository = require('../../repositories/JobRepository');
const ApplicationRepository = require('../../repositories/ApplicationRepository');
const CandidateRepository = require('../../repositories/CandidateRepository');
const EmployerRepository = require('../../repositories/EmployerRepository');
const CompanyRepository = require('../../repositories/CompanyRepository');
const NotificationRepository = require('../../repositories/NotificationRepository');
const QueueService = require('../external/QueueService');
const EmailService = require('../external/EmailService');

class AdminService {
  constructor() {
    this.userRepository = new UserRepository();
    this.jobRepository = new JobRepository();
    this.applicationRepository = new ApplicationRepository();
    this.candidateRepository = new CandidateRepository();
    this.employerRepository = new EmployerRepository();
    this.companyRepository = new CompanyRepository();
    this.notificationRepository = new NotificationRepository();
  }

  async getSystemDashboard() {
    try {
      // Get system statistics
      const totalUsers = await this.userRepository.count({});
      const totalCandidates = await this.candidateRepository.count({});
      const totalEmployers = await this.employerRepository.count({});
      const totalCompanies = await this.companyRepository.count({});
      const totalJobs = await this.jobRepository.count({});
      const totalApplications = await this.applicationRepository.count({});

      // Get recent activity
      const recentUsers = await this.userRepository.find(
        {},
        { limit: 5, sort: { createdAt: -1 } }
      );

      const recentJobs = await this.jobRepository.find(
        {},
        { limit: 5, sort: { createdAt: -1 }, populate: ['employerId'] }
      );

      const recentApplications = await this.applicationRepository.find(
        {},
        {
          limit: 5,
          sort: { appliedAt: -1 },
          populate: ['candidateId', 'jobId'],
        }
      );

      // Get user growth data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsers = await this.userRepository.count({
        createdAt: { $gte: thirtyDaysAgo },
      });

      const newJobs = await this.jobRepository.count({
        createdAt: { $gte: thirtyDaysAgo },
      });

      const newApplications = await this.applicationRepository.count({
        appliedAt: { $gte: thirtyDaysAgo },
      });

      return {
        success: true,
        dashboard: {
          stats: {
            totalUsers,
            totalCandidates,
            totalEmployers,
            totalCompanies,
            totalJobs,
            totalApplications,
            newUsers,
            newJobs,
            newApplications,
          },
          recentActivity: {
            users: recentUsers.map(user => ({
              id: user._id,
              email: user.email,
              role: user.role,
              createdAt: user.createdAt,
            })),
            jobs: recentJobs.map(job => ({
              id: job._id,
              title: job.title,
              status: job.status,
              employer: job.employerId,
              createdAt: job.createdAt,
            })),
            applications: recentApplications.map(app => ({
              id: app._id,
              candidate: app.candidateId,
              job: app.jobId,
              status: app.status,
              appliedAt: app.appliedAt,
            })),
          },
        },
      };
    } catch (error) {
      throw new Error(`Get system dashboard failed: ${error.message}`);
    }
  }

  async getAllUsers(filters = {}) {
    try {
      const { page = 1, limit = 20, role, status, search } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { 'profile.fullName': { $regex: search, $options: 'i' } },
        ];
      }

      const users = await this.userRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
      });

      const total = await this.userRepository.count(query);

      return {
        success: true,
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all users failed: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get user by ID failed: ${error.message}`);
    }
  }

  async updateUserStatus(userId, statusData) {
    try {
      const { status, reason } = statusData;

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update user status
      const updatedUser = await this.userRepository.update(userId, {
        status,
        statusReason: reason,
      });

      // Send notification to user
      await this.notificationRepository.create({
        userId,
        type: 'system_alert',
        title: 'Account Status Updated',
        message: `Your account status has been updated to ${status}`,
        priority: 'high',
        isRead: false,
      });

      return {
        success: true,
        user: {
          id: updatedUser._id,
          status: updatedUser.status,
          statusReason: updatedUser.statusReason,
        },
        message: 'User status updated successfully',
      };
    } catch (error) {
      throw new Error(`Update user status failed: ${error.message}`);
    }
  }

  async deleteUser(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete user
      await this.userRepository.softDelete(userId);

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete user failed: ${error.message}`);
    }
  }

  async getSystemStats() {
    try {
      const totalUsers = await this.userRepository.count({});
      const activeUsers = await this.userRepository.count({ status: 'active' });
      const totalJobs = await this.jobRepository.count({});
      const activeJobs = await this.jobRepository.count({
        status: 'published',
      });
      const totalApplications = await this.applicationRepository.count({});

      const usersByRole = await this.userRepository.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]);

      const jobsByStatus = await this.jobRepository.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const applicationsByStatus = await this.applicationRepository.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      return {
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          totalJobs,
          activeJobs,
          totalApplications,
          usersByRole,
          jobsByStatus,
          applicationsByStatus,
        },
      };
    } catch (error) {
      throw new Error(`Get system stats failed: ${error.message}`);
    }
  }

  async getSystemLogs(filters = {}) {
    try {
      const { page = 1, limit = 50, level, startDate, endDate } = filters;
      const skip = (page - 1) * limit;

      // This would typically come from a logging service
      // For now, return mock data
      const logs = [
        {
          id: '1',
          level: 'info',
          message: 'User login successful',
          timestamp: new Date(),
          userId: 'user123',
        },
        {
          id: '2',
          level: 'error',
          message: 'Database connection failed',
          timestamp: new Date(),
          userId: null,
        },
      ];

      return {
        success: true,
        logs,
        pagination: {
          page,
          limit,
          total: logs.length,
          pages: 1,
        },
      };
    } catch (error) {
      throw new Error(`Get system logs failed: ${error.message}`);
    }
  }

  async getSystemHealth() {
    try {
      // Check database connection
      const dbHealth = await this.userRepository.count({});
      const dbStatus = dbHealth >= 0 ? 'healthy' : 'unhealthy';

      // Check queue status
      const queueHealth = await QueueService.getQueueHealth();

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryStatus =
        memoryUsage.heapUsed / memoryUsage.heapTotal < 0.8
          ? 'healthy'
          : 'warning';

      return {
        success: true,
        health: {
          database: {
            status: dbStatus,
            connected: dbHealth >= 0,
          },
          queues: queueHealth,
          memory: {
            status: memoryStatus,
            used: memoryUsage.heapUsed,
            total: memoryUsage.heapTotal,
            percentage: Math.round(
              (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
            ),
          },
          uptime: process.uptime(),
          timestamp: new Date(),
        },
      };
    } catch (error) {
      throw new Error(`Get system health failed: ${error.message}`);
    }
  }

  async getQueueStatus() {
    try {
      const queueHealth = await QueueService.getQueueHealth();

      return {
        success: true,
        queues: queueHealth,
      };
    } catch (error) {
      throw new Error(`Get queue status failed: ${error.message}`);
    }
  }

  async clearQueue(queueName) {
    try {
      await QueueService.clearQueue(queueName);

      return {
        success: true,
        message: `Queue ${queueName} cleared successfully`,
      };
    } catch (error) {
      throw new Error(`Clear queue failed: ${error.message}`);
    }
  }

  async getSystemSettings() {
    try {
      // This would typically come from a settings service
      const settings = {
        siteName: process.env.SITE_NAME || 'Smart Recruitment Platform',
        siteDescription:
          process.env.SITE_DESCRIPTION || 'AI-powered recruitment platform',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
        emailVerificationRequired:
          process.env.EMAIL_VERIFICATION_REQUIRED === 'true',
        maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
        allowedFileTypes: process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx',
      };

      return {
        success: true,
        settings,
      };
    } catch (error) {
      throw new Error(`Get system settings failed: ${error.message}`);
    }
  }

  async updateSystemSettings(settings) {
    try {
      // This would typically update a settings service
      // For now, just return success
      return {
        success: true,
        settings,
        message: 'System settings updated successfully',
      };
    } catch (error) {
      throw new Error(`Update system settings failed: ${error.message}`);
    }
  }

  async sendSystemNotification(notificationData) {
    try {
      const {
        title,
        message,
        type = 'system_alert',
        priority = 'medium',
        targetUsers = 'all',
      } = notificationData;

      let userIds = [];
      if (targetUsers === 'all') {
        const users = await this.userRepository.find({ status: 'active' });
        userIds = users.map(user => user._id);
      } else if (Array.isArray(targetUsers)) {
        userIds = targetUsers;
      }

      // Create notifications for all target users
      const notifications = [];
      for (const userId of userIds) {
        const notification = await this.notificationRepository.create({
          userId,
          type,
          title,
          message,
          priority,
          isRead: false,
        });
        notifications.push(notification);
      }

      return {
        success: true,
        notification: {
          title,
          message,
          type,
          priority,
          targetUsers: userIds.length,
        },
        message: `System notification sent to ${userIds.length} users`,
      };
    } catch (error) {
      throw new Error(`Send system notification failed: ${error.message}`);
    }
  }

  async getSystemReports(filters = {}) {
    try {
      const { type, startDate, endDate } = filters;

      // This would typically generate various reports
      const reports = {
        userGrowth: {
          title: 'User Growth Report',
          data: [],
        },
        jobPostings: {
          title: 'Job Postings Report',
          data: [],
        },
        applications: {
          title: 'Applications Report',
          data: [],
        },
      };

      return {
        success: true,
        reports,
      };
    } catch (error) {
      throw new Error(`Get system reports failed: ${error.message}`);
    }
  }
}

module.exports = new AdminService();
