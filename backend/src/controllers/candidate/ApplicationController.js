const mongoose = require('mongoose');
const CandidateProfile = require('../../models/CandidateProfile');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');

class ApplicationController {
  constructor() {
    // Bind all methods to preserve this context
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationStatusStats =
      this.getApplicationStatusStats.bind(this);
    this.applyForJob = this.applyForJob.bind(this);
    this.updateApplication = this.updateApplication.bind(this);
  }

  // ============================================
  // APPLICATIONS MANAGEMENT
  // ============================================

  /**
   * GET /api/candidates/applications
   * Get applications with flexible filtering
   * Query: ?status=&job_id=&page=1&id=xxx (for detail)
   */
  async getApplications(req, res, next) {
    try {
      const { status, job_id, page = 1, limit = 10, id } = req.query;

      // If specific application ID requested, return detail
      if (id) {
        return this._getApplicationDetail(id, req, res, next);
      }

      // Get candidate profile first (similar to applyForJob)
      const candidateProfile = await CandidateProfile.findOne({
        userId: req.user.id,
      });

      if (!candidateProfile) {
        return ApiResponse.error(
          res,
          'Candidate profile not found. Please complete your profile first.',
          404
        );
      }

      // Build filter using candidateProfile._id
      let filter = { candidateId: candidateProfile._id };
      if (status) filter.status = status;
      if (job_id) filter.jobId = job_id;

      const applications = await Application.find(filter)
        .populate('jobId', 'title company location salaryMin salaryMax status')
        .populate('jobId.employer', 'company.name company.logo')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Application.countDocuments(filter);

      return ApiResponse.success(
        res,
        {
          applications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total,
            hasMore: page < Math.ceil(total / limit),
          },
        },
        'Applications retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/applications/status
   * Thống kê số lượng đơn ứng tuyển theo status cho ứng viên hiện tại
   * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (optional)
   */
  async getApplicationStatusStats(req, res, next) {
    try {
      const { from, to } = req.query;

      // Lấy hồ sơ ứng viên
      const candidateProfile = await CandidateProfile.findOne({
        userId: req.user.id,
      });

      if (!candidateProfile) {
        return ApiResponse.error(
          res,
          'Candidate profile not found. Please complete your profile first.',
          404
        );
      }

      const match = { candidateId: candidateProfile._id };

      if (from || to) {
        match.createdAt = {};
        if (from) {
          const fromDate = new Date(from);
          if (isNaN(fromDate.getTime())) {
            return ApiResponse.error(res, 'Invalid start date', 400);
          }
          match.createdAt.$gte = fromDate;
        }
        if (to) {
          const toDate = new Date(to);
          if (isNaN(toDate.getTime())) {
            return ApiResponse.error(res, 'Invalid end date', 400);
          }
          match.createdAt.$lte = toDate;
        }
        if (Object.keys(match.createdAt).length === 0) {
          delete match.createdAt;
        }
      }

      const stats = await Application.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, status: '$_id', count: 1 } },
        { $sort: { status: 1 } },
      ]);

      return ApiResponse.success(
        res,
        { stats },
        'Application status statistics retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/candidates/applications
   * Apply for a job
   * Body: { job_id, resume_id, cover_letter, answers: [...] }
   */
  async applyForJob(req, res, next) {
    try {
      const { job_id, resume_id, cover_letter, answers } = req.body;

      // Check if job exists and is active
      const job = await Job.findById(job_id);
      if (!job || job.status !== 'active' || job.deletedAt) {
        throw new AppError('Job not found or not available', 404);
      }

      // Get candidate profile first
      const candidateProfile = await CandidateProfile.findOne({
        userId: req.user.id,
      });

      if (!candidateProfile) {
        throw new AppError('Candidate profile not found', 404);
      }

      // Check if already applied
      const existingApplication = await Application.findOne({
        candidateId: candidateProfile._id,
        jobId: job_id,
      });

      if (existingApplication) {
        throw new AppError('You have already applied for this job', 400);
      }

      // Create application
      const application = new Application({
        candidateId: candidateProfile._id,
        jobId: job_id,
        coverLetter: cover_letter,
        resume: {
          url: candidateProfile.resume.current.url,
          version: resume_id || 1,
          uploadedAt: new Date(),
        },
        answers: answers || [],
        status: 'pending',
        timeline: [
          {
            status: 'pending',
            note: 'Application submitted',
            createdAt: new Date(),
            createdBy: req.user.id,
          },
        ],
        matchingScore: {
          overall: this._calculateMatchScore(candidateProfile, job),
        },
      });

      await application.save();

      // Update job stats
      job.stats.applications += 1;
      await job.save();

      // Update candidate stats
      candidateProfile.analytics.applicationStats.total += 1;
      candidateProfile.analytics.applicationStats.pending += 1;
      await candidateProfile.save();

      // Log before notification
      const { logger } = require('../../utils/logger');
      logger.info('Application saved successfully, starting notification process', {
        applicationId: application._id.toString(),
        jobId: job._id.toString(),
      });
      
      // IMPORTANT: Log để đảm bảo code được chạy
      console.log('🔔 [NOTIFICATION] Starting notification process for application:', application._id.toString());

      // Notify employer về application mới
      try {
        console.log('🔔 [NOTIFICATION] Entering try block for employer notification');
        const NotificationService = require('../../services/notification/notificationService');
        const User = require('../../models/User');
        const EmployerProfile = require('../../models/EmployerProfile');
        const { logger } = require('../../utils/logger');
        
        logger.info('=== START NOTIFICATION PROCESS ===', {
          jobId: job._id.toString(),
          applicationId: application._id.toString(),
          jobEmployer: job.employer,
          jobEmployerType: typeof job.employer,
        });
        
        // Lấy employer ID (có thể là ObjectId hoặc đã populate)
        const employerId = job.employer?._id || job.employer;
        
        logger.info('Extracted employerId', {
          employerId: employerId?.toString(),
          employerIdType: typeof employerId,
        });
        
        if (!employerId) {
          logger.warn('❌ Job has no employer, cannot send notification', {
            jobId: job._id.toString(),
            applicationId: application._id.toString(),
            jobData: {
              _id: job._id,
              title: job.title,
              employer: job.employer,
            },
          });
        } else {
          logger.info('✅ Found employerId, fetching employer profile...', {
            employerId: employerId.toString(),
            jobId: job._id.toString(),
            applicationId: application._id.toString(),
          });
          
          // Lấy employer profile
          const employerProfile = await EmployerProfile.findById(employerId);
          logger.info('EmployerProfile query result', {
            found: !!employerProfile,
            profileId: employerProfile?._id?.toString(),
            hasOwner: !!employerProfile?.owner,
            ownerId: employerProfile?.owner?.toString(),
          });
          
          if (!employerProfile) {
            logger.warn('❌ Employer profile not found', {
              employerId: employerId.toString(),
              jobId: job._id.toString(),
            });
          } else if (!employerProfile.owner) {
            logger.warn('❌ Employer profile has no owner', {
              employerProfileId: employerProfile._id.toString(),
              jobId: job._id.toString(),
            });
          } else {
            logger.info('✅ Found employer profile with owner, fetching user...', {
              ownerId: employerProfile.owner.toString(),
              employerProfileId: employerProfile._id.toString(),
            });
            
            // Lấy employer user
            const employerUser = await User.findById(employerProfile.owner);
            logger.info('User query result', {
              found: !!employerUser,
              userId: employerUser?._id?.toString(),
              email: employerUser?.email,
            });
            
            if (!employerUser) {
              logger.warn('❌ Employer user not found', {
                ownerId: employerProfile.owner.toString(),
                employerProfileId: employerProfile._id.toString(),
              });
            } else {
              logger.info('✅ Found employer user, sending notification...', {
                employerUserId: employerUser._id.toString(),
                employerEmail: employerUser.email,
                candidateName: req.user.fullName || req.user.email || 'Ứng viên',
              });
              
              // Gửi notification (lưu candidateId để có thể cập nhật sau)
              const notification = await NotificationService.notifyNewApplication(
                employerUser._id.toString(),
                application._id.toString(),
                job._id.toString(),
                req.user.fullName || req.user.email || 'Ứng viên',
                req.user.id.toString() // Lưu candidateId
              );
              
              logger.info('✅ Notification sent successfully to employer', {
                notificationId: notification?._id?.toString(),
                employerUserId: employerUser._id.toString(),
                applicationId: application._id.toString(),
              });
            }
          }
        }
        
        logger.info('=== END NOTIFICATION PROCESS ===');
        console.log('🔔 [NOTIFICATION] Employer notification process completed');
      } catch (notifyError) {
        // Log error nhưng không fail request
        const { logger } = require('../../utils/logger');
        console.error('🔔 [NOTIFICATION] ERROR in employer notification:', notifyError.message);
        logger.error('❌ Failed to send notification to employer', {
          error: notifyError.message,
          stack: notifyError.stack,
          jobId: job._id?.toString(),
          applicationId: application._id?.toString(),
        });
      }

      // Notify candidate về application thành công (optional)
      try {
        console.log('🔔 [NOTIFICATION] Starting candidate notification');
        const NotificationService = require('../../services/notification/notificationService');
        const { logger } = require('../../utils/logger');
        
        await NotificationService.notifyApplicationStatusChange(
          req.user.id.toString(),
          application._id.toString(),
          job._id.toString(),
          job.title,
          'pending' // Status mới là pending
        );
        
        logger.info('Notification sent to candidate for successful application', {
          candidateId: req.user.id,
          applicationId: application._id.toString(),
        });
        console.log('🔔 [NOTIFICATION] Candidate notification sent successfully');
      } catch (candidateNotifyError) {
        // Log error nhưng không fail request
        const { logger } = require('../../utils/logger');
        console.error('🔔 [NOTIFICATION] ERROR in candidate notification:', candidateNotifyError.message);
        logger.error('Failed to send notification to candidate', {
          error: candidateNotifyError.message,
          candidateId: req.user.id,
        });
      }
      
      console.log('🔔 [NOTIFICATION] All notification processes completed');

      return ApiResponse.success(
        res,
        application,
        'Application submitted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/candidates/applications/:id
   * Handle application actions
   * Body: { action: "withdraw" }
   */
  async updateApplication(req, res, next) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      if (action !== 'withdraw') {
        throw new AppError('Invalid action. Only "withdraw" is supported', 400);
      }

      const application = await Application.findById(id);
      if (
        !application ||
        application.candidateId.toString() !== req.user.candidateProfile
      ) {
        throw new AppError('Application not found', 404);
      }

      if (['hired', 'rejected'].includes(application.status)) {
        throw new AppError(
          'Cannot withdraw application in current status',
          400
        );
      }

      application.status = 'withdrawn';
      application.timeline.push({
        status: 'withdrawn',
        note: 'Application withdrawn by candidate',
        createdAt: new Date(),
        createdBy: req.user.id,
      });

      await application.save();

      // Notify employer về application withdrawn
      try {
        const NotificationService = require('../../services/notification/notificationService');
        const EmployerProfile = require('../../models/EmployerProfile');
        
        await application.populate('jobId', 'employer title');
        if (application.jobId && application.jobId.employer) {
          const employerProfile = await EmployerProfile.findById(application.jobId.employer);
          if (employerProfile && employerProfile.owner) {
            await NotificationService.notifyApplicationWithdrawn(
              employerProfile.owner.toString(),
              application._id.toString(),
              application.jobId.title || 'Công việc',
              req.user.fullName || req.user.email
            );
          }
        }
      } catch (notifyError) {
        console.error('Failed to send withdrawal notification to employer:', notifyError);
      }

      return ApiResponse.success(
        res,
        application,
        'Application withdrawn successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Get application detail
   */
  async _getApplicationDetail(id, req, res, next) {
    const application = await Application.findById(id)
      .populate('jobId')
      .populate('candidateId')
      .populate('timeline.createdBy', 'fullName');

    if (
      !application ||
      application.candidateId.userId.toString() !== req.user.id
    ) {
      throw new AppError('Application not found', 404);
    }

    return ApiResponse.success(
      res,
      application,
      'Application details retrieved successfully'
    );
  }

  /**
   * Calculate job match score
   */
  _calculateMatchScore(candidateProfile, job) {
    // Simplified match score calculation
    let score = 0;
    let factors = 0;

    // Skills matching
    const profileSkills =
      candidateProfile.skills?.technical?.map(s => s.name.toLowerCase()) || [];
    const jobSkills = job.skills?.map(s => s.toLowerCase()) || [];

    if (profileSkills.length > 0 && jobSkills.length > 0) {
      const matchingSkills = profileSkills.filter(skill =>
        jobSkills.some(
          jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill)
        )
      );
      score += (matchingSkills.length / jobSkills.length) * 50;
      factors++;
    }

    // Location matching
    if (candidateProfile.preferences?.locations?.length > 0 && job.location) {
      const locationMatch = candidateProfile.preferences.locations.some(loc =>
        job.location.toLowerCase().includes(loc.toLowerCase())
      );
      if (locationMatch) score += 20;
      factors++;
    }

    // Industry matching
    if (candidateProfile.preferences?.industries?.length > 0 && job.industry) {
      const industryMatch = candidateProfile.preferences.industries.includes(
        job.industry
      );
      if (industryMatch) score += 15;
      factors++;
    }

    // Default score if no factors
    if (factors === 0) return 60;

    // Experience level matching
    const hasInternshipExp =
      candidateProfile.experience?.internships?.length > 0;
    const hasProjectExp = candidateProfile.experience?.projects?.length > 0;
    if (hasInternshipExp || hasProjectExp) {
      score += 15;
      factors++;
    }

    return Math.min(Math.round(score / factors), 100);
  }
}

module.exports = ApplicationController;
