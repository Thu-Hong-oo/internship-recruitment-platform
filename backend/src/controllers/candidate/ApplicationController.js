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

      // Build filter
      let filter = { candidateId: req.user.candidateProfile };
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

      // Check if already applied
      const existingApplication = await Application.findOne({
        candidateId: req.user.candidateProfile,
        jobId: job_id,
      });

      if (existingApplication) {
        throw new AppError('You have already applied for this job', 400);
      }

      // Get candidate profile
      const candidateProfile = await CandidateProfile.findOne({
        userId: req.user.id,
      });

      if (!candidateProfile) {
        throw new AppError('Candidate profile not found', 404);
      }

      // Create application
      const application = new Application({
        candidateId: req.user.candidateProfile,
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
