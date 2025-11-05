const ApplicationRepository = require('../../repositories/ApplicationRepository');
const JobRepository = require('../../repositories/JobRepository');
const CandidateRepository = require('../../repositories/CandidateRepository');
const CVRepository = require('../../repositories/CVRepository');
const ValidationService = require('./ValidationService');
const EmailService = require('../external/EmailService');
const SocketService = require('../external/SocketService');

class ApplicationService {
  constructor() {
    this.applicationRepository = new ApplicationRepository();
    this.jobRepository = new JobRepository();
    this.candidateRepository = new CandidateRepository();
    this.cvRepository = new CVRepository();
    this.validationService = new ValidationService();
  }

  async applyForJob(candidateId, applicationData) {
    try {
      // Validate application data
      const validation =
        this.validationService.validateApplication(applicationData);
      if (!validation.isValid) {
        throw new Error(
          `Application validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Check if job exists and is active
      const job = await this.jobRepository.findById(applicationData.jobId);
      if (!job || job.status !== 'published') {
        throw new Error('Job not found or not available for applications');
      }

      // Check if candidate already applied
      const existingApplication = await this.applicationRepository.findOne({
        jobId: applicationData.jobId,
        candidateId,
      });
      if (existingApplication) {
        throw new Error('You have already applied for this job');
      }

      // Get candidate's default CV if no specific CV provided
      let cvId = applicationData.cvId;
      if (!cvId) {
        const defaultCV = await this.cvRepository.getDefaultCV(candidateId);
        if (defaultCV) {
          cvId = defaultCV._id;
        }
      }

      // Create application
      const application = await this.applicationRepository.create({
        ...applicationData,
        candidateId,
        cvId,
        status: 'pending',
        appliedAt: new Date(),
      });

      // Notify employer
      await SocketService.notifyNewApplication(job.employerId, {
        applicationId: application._id,
        candidateName: application.candidateName,
        jobTitle: job.title,
        appliedAt: application.appliedAt,
      });

      // Send confirmation email to candidate
      await EmailService.sendApplicationConfirmation(
        application.candidateEmail,
        {
          jobTitle: job.title,
          companyName: job.companyName,
          appliedAt: application.appliedAt,
          status: application.status,
        }
      );

      return {
        success: true,
        application: {
          id: application._id,
          jobId: application.jobId,
          candidateId: application.candidateId,
          status: application.status,
          appliedAt: application.appliedAt,
        },
        message: 'Application submitted successfully',
      };
    } catch (error) {
      throw new Error(`Application submission failed: ${error.message}`);
    }
  }

  async getCandidateApplications(candidateId, filters = {}) {
    try {
      const { page = 1, limit = 10, status } = filters;
      const skip = (page - 1) * limit;

      const query = { candidateId };
      if (status) query.status = status;

      const applications = await this.applicationRepository.find(query, {
        skip,
        limit,
        sort: { appliedAt: -1 },
        populate: ['jobId', 'cvId'],
      });

      const total = await this.applicationRepository.count(query);

      return {
        success: true,
        applications: applications.map(app => ({
          id: app._id,
          jobId: app.jobId,
          cvId: app.cvId,
          status: app.status,
          appliedAt: app.appliedAt,
          viewedAt: app.viewedAt,
          job: app.jobId,
          cv: app.cvId,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get candidate applications failed: ${error.message}`);
    }
  }

  async getJobApplications(jobId, employerId, filters = {}) {
    try {
      // Verify job ownership
      const job = await this.jobRepository.findById(jobId);
      if (!job || job.employerId.toString() !== employerId) {
        throw new Error('Job not found or access denied');
      }

      const { page = 1, limit = 10, status } = filters;
      const skip = (page - 1) * limit;

      const query = { jobId };
      if (status) query.status = status;

      const applications = await this.applicationRepository.find(query, {
        skip,
        limit,
        sort: { appliedAt: -1 },
        populate: ['candidateId', 'cvId'],
      });

      const total = await this.applicationRepository.count(query);

      return {
        success: true,
        applications: applications.map(app => ({
          id: app._id,
          candidateId: app.candidateId,
          cvId: app.cvId,
          status: app.status,
          appliedAt: app.appliedAt,
          viewedAt: app.viewedAt,
          candidate: app.candidateId,
          cv: app.cvId,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get job applications failed: ${error.message}`);
    }
  }

  async getApplicationById(applicationId, user) {
    try {
      const application = await this.applicationRepository.findById(
        applicationId,
        ['jobId', 'candidateId', 'cvId']
      );

      if (!application) {
        throw new Error('Application not found');
      }

      // Check access permissions
      const hasAccess =
        user.role === 'admin' ||
        application.candidateId.toString() === user.candidateId ||
        (user.role === 'employer' &&
          application.jobId.employerId.toString() === user.employerId);

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      return {
        success: true,
        application: {
          id: application._id,
          jobId: application.jobId,
          candidateId: application.candidateId,
          cvId: application.cvId,
          status: application.status,
          appliedAt: application.appliedAt,
          viewedAt: application.viewedAt,
          employerNotes: application.employerNotes,
          candidateNotes: application.candidateNotes,
          job: application.jobId,
          candidate: application.candidateId,
          cv: application.cvId,
        },
      };
    } catch (error) {
      throw new Error(`Get application by ID failed: ${error.message}`);
    }
  }

  async updateApplicationStatus(applicationId, employerId, statusData) {
    try {
      const application = await this.applicationRepository.findById(
        applicationId,
        ['jobId']
      );
      if (!application) {
        throw new Error('Application not found');
      }

      // Verify job ownership
      const job = await this.jobRepository.findById(application.jobId);
      if (!job || job.employerId.toString() !== employerId) {
        throw new Error('Access denied');
      }

      // Update application status
      const updatedApplication = await this.applicationRepository.update(
        applicationId,
        {
          status: statusData.status,
          employerNotes: statusData.notes,
        }
      );

      // Notify candidate if requested
      if (statusData.notify) {
        await SocketService.notifyApplicationStatus(
          applicationId,
          application.candidateId,
          statusData.status
        );

        // Send email notification
        await EmailService.sendApplicationStatusUpdate(
          application.candidateEmail,
          {
            jobTitle: job.title,
            companyName: job.companyName,
            status: statusData.status,
          }
        );
      }

      return {
        success: true,
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
          employerNotes: updatedApplication.employerNotes,
        },
        message: 'Application status updated successfully',
      };
    } catch (error) {
      throw new Error(`Update application status failed: ${error.message}`);
    }
  }

  async withdrawApplication(applicationId, candidateId) {
    try {
      const application = await this.applicationRepository.findById(
        applicationId
      );
      if (!application || application.candidateId.toString() !== candidateId) {
        throw new Error('Application not found or access denied');
      }

      if (!application.canWithdraw()) {
        throw new Error('Application cannot be withdrawn at this time');
      }

      // Update application status
      const updatedApplication = await this.applicationRepository.update(
        applicationId,
        {
          status: 'withdrawn',
        }
      );

      return {
        success: true,
        application: {
          id: updatedApplication._id,
          status: updatedApplication.status,
        },
        message: 'Application withdrawn successfully',
      };
    } catch (error) {
      throw new Error(`Withdraw application failed: ${error.message}`);
    }
  }

  async sendApplicationNotification(applicationId, employerId, message) {
    try {
      const application = await this.applicationRepository.findById(
        applicationId,
        ['jobId', 'candidateId', 'candidateEmail']
      );
      if (!application) {
        throw new Error('Application not found');
      }

      // Verify job ownership
      const job = await this.jobRepository.findById(application.jobId);
      if (!job || job.employerId.toString() !== employerId) {
        throw new Error('Access denied');
      }

      // Send notification via socket
      await SocketService.sendToUser(
        application.candidateId,
        'application-notification',
        {
          applicationId,
          jobTitle: job.title,
          companyName: job.companyName,
          message,
        }
      );

      // Send email
      await EmailService.sendCustomNotification(application.candidateEmail, {
        subject: `Thông báo từ ${job.companyName}`,
        message,
        jobTitle: job.title,
      });

      return {
        success: true,
        message: 'Notification sent successfully',
      };
    } catch (error) {
      throw new Error(`Send notification failed: ${error.message}`);
    }
  }

  async markApplicationAsViewed(applicationId, employerId) {
    try {
      const application = await this.applicationRepository.findById(
        applicationId,
        ['jobId']
      );
      if (!application) {
        throw new Error('Application not found');
      }

      // Verify job ownership
      const job = await this.jobRepository.findById(application.jobId);
      if (!job || job.employerId.toString() !== employerId) {
        throw new Error('Access denied');
      }

      // Mark as viewed
      const updatedApplication = await this.applicationRepository.markAsViewed(
        applicationId
      );

      return {
        success: true,
        application: {
          id: updatedApplication._id,
          viewedAt: updatedApplication.viewedAt,
          status: updatedApplication.status,
        },
        message: 'Application marked as viewed',
      };
    } catch (error) {
      throw new Error(`Mark application as viewed failed: ${error.message}`);
    }
  }

  async addEmployerNotes(applicationId, employerId, notes) {
    try {
      const application = await this.applicationRepository.findById(
        applicationId,
        ['jobId']
      );
      if (!application) {
        throw new Error('Application not found');
      }

      // Verify job ownership
      const job = await this.jobRepository.findById(application.jobId);
      if (!job || job.employerId.toString() !== employerId) {
        throw new Error('Access denied');
      }

      // Add employer notes
      const updatedApplication = await this.applicationRepository.update(
        applicationId,
        {
          employerNotes: notes,
        }
      );

      return {
        success: true,
        application: {
          id: updatedApplication._id,
          employerNotes: updatedApplication.employerNotes,
        },
        message: 'Employer notes added successfully',
      };
    } catch (error) {
      throw new Error(`Add employer notes failed: ${error.message}`);
    }
  }

  async getApplicationStats(user) {
    try {
      let stats = {};

      if (user.role === 'candidate') {
        const totalApplications = await this.applicationRepository.count({
          candidateId: user.candidateId,
        });
        const pendingApplications = await this.applicationRepository.count({
          candidateId: user.candidateId,
          status: 'pending',
        });
        const reviewedApplications = await this.applicationRepository.count({
          candidateId: user.candidateId,
          status: 'reviewed',
        });

        stats = {
          totalApplications,
          pendingApplications,
          reviewedApplications,
        };
      } else if (user.role === 'employer') {
        // Get employer's job IDs
        const jobs = await this.jobRepository.find({
          employerId: user.employerId,
        });
        const jobIds = jobs.map(job => job._id);

        const totalApplications = await this.applicationRepository.count({
          jobId: { $in: jobIds },
        });
        const pendingApplications = await this.applicationRepository.count({
          jobId: { $in: jobIds },
          status: 'pending',
        });
        const reviewedApplications = await this.applicationRepository.count({
          jobId: { $in: jobIds },
          status: 'reviewed',
        });

        stats = {
          totalApplications,
          pendingApplications,
          reviewedApplications,
        };
      }

      return {
        success: true,
        stats,
      };
    } catch (error) {
      throw new Error(`Get application stats failed: ${error.message}`);
    }
  }

  async getEmployerApplicationStats(employerId) {
    try {
      // Get employer's job IDs
      const jobs = await this.jobRepository.find({ employerId });
      const jobIds = jobs.map(job => job._id);

      const totalApplications = await this.applicationRepository.count({
        jobId: { $in: jobIds },
      });

      const applicationsByStatus = await this.applicationRepository.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const recentApplications = await this.applicationRepository.find(
        { jobId: { $in: jobIds } },
        {
          limit: 5,
          sort: { appliedAt: -1 },
          populate: ['candidateId', 'jobId'],
        }
      );

      return {
        success: true,
        stats: {
          totalApplications,
          applicationsByStatus,
          recentApplications: recentApplications.map(app => ({
            id: app._id,
            candidateName: app.candidateName,
            jobTitle: app.jobTitle,
            status: app.status,
            appliedAt: app.appliedAt,
          })),
        },
      };
    } catch (error) {
      throw new Error(
        `Get employer application stats failed: ${error.message}`
      );
    }
  }
}

module.exports = new ApplicationService();
