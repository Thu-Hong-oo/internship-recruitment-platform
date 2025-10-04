const CandidateProfile = require('../../models/CandidateProfile');
const Job = require('../../models/Job');
const SavedJob = require('../../models/SavedJob');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');

class JobController {
  constructor() {
    // Bind all methods to preserve this context
    this.getJobs = this.getJobs.bind(this);
    this.handleJobAction = this.handleJobAction.bind(this);
  }

  // ============================================
  // JOBS MANAGEMENT
  // ============================================

  /**
   * GET /api/candidates/jobs
   * Unified job search, saved jobs, company jobs
   * Query: ?keyword=&location=&type=saved|following|search&company_id=
   */
  async getJobs(req, res, next) {
    try {
      const {
        keyword,
        location,
        type = 'search',
        company_id,
        page = 1,
        limit = 10,
      } = req.query;

      switch (type) {
        case 'saved':
          return this._getSavedJobs(req, res, next);
        case 'following':
          return this._getFollowingCompanyJobs(req, res, next);
        case 'search':
        default:
          return this._searchJobs(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/candidates/jobs/:id/action
   * Handle job actions: save, unsave, apply
   * Body: { action: "save" | "unsave" | "apply" }
   */
  async handleJobAction(req, res, next) {
    try {
      const { id: jobId } = req.params;
      const { action } = req.body;

      switch (action) {
        case 'save':
          return this._saveJob(jobId, req, res, next);
        case 'unsave':
          return this._unsaveJob(jobId, req, res, next);
        case 'apply':
          throw new AppError(
            'Apply action should be handled by ApplicationController',
            400
          );
        default:
          throw new AppError(
            'Invalid action. Must be: save, unsave, or apply',
            400
          );
      }
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Search jobs
   */
  async _searchJobs(req, res, next) {
    const {
      keyword,
      location,
      industry,
      skills,
      jobType,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 10,
    } = req.query;

    // Build search filter
    let filter = {
      status: 'active',
      deletedAt: null,
      deadline: { $gte: new Date() },
    };

    // Text search
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { skills: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }

    // Filters
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (industry) filter.industry = industry;
    if (skills) filter.skills = { $in: skills.split(',') };
    if (jobType) filter.jobType = jobType;
    if (salaryMin) filter.salaryMin = { $gte: parseInt(salaryMin) };
    if (salaryMax) filter.salaryMax = { $lte: parseInt(salaryMax) };

    const jobs = await Job.find(filter)
      .populate('employer', 'company.name company.logo company.industry')
      .select(
        'title description skills level jobType location salaryMin salaryMax deadline views stats createdAt'
      )
      .sort({ createdAt: -1, views: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(filter);

    return ApiResponse.success(
      res,
      {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalJobs: total,
          hasMore: page < Math.ceil(total / limit),
        },
      },
      'Jobs retrieved successfully'
    );
  }

  /**
   * Get saved jobs
   */
  async _getSavedJobs(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    const savedJobs = await SavedJob.find({
      candidateId: req.user.candidateProfile,
    })
      .populate(
        'jobId',
        'title company location salaryMin salaryMax status createdAt'
      )
      .populate('jobId.employer', 'company.name company.logo')
      .sort({ savedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SavedJob.countDocuments({
      candidateId: req.user.candidateProfile,
    });

    // Filter out jobs that are no longer active
    const activeSavedJobs = savedJobs.filter(
      saved => saved.jobId && saved.jobId.status === 'active'
    );

    return ApiResponse.success(
      res,
      {
        savedJobs: activeSavedJobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasMore: page < Math.ceil(total / limit),
        },
      },
      'Saved jobs retrieved successfully'
    );
  }

  /**
   * Get jobs from followed companies
   */
  async _getFollowingCompanyJobs(req, res, next) {
    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (
      !profile ||
      !profile.followedCompanies ||
      profile.followedCompanies.length === 0
    ) {
      return ApiResponse.success(
        res,
        { jobs: [], pagination: { total: 0 } },
        'No jobs from followed companies'
      );
    }

    const jobs = await Job.find({
      employer: { $in: profile.followedCompanies },
      status: 'active',
      deletedAt: null,
    })
      .populate('employer', 'company.name company.logo')
      .sort({ createdAt: -1 });

    return ApiResponse.success(
      res,
      { jobs },
      'Jobs from followed companies retrieved successfully'
    );
  }

  /**
   * Save job
   */
  async _saveJob(jobId, req, res, next) {
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      throw new AppError('Job not found', 404);
    }

    // Check if already saved
    const existingSavedJob = await SavedJob.findOne({
      candidateId: req.user.candidateProfile,
      jobId,
    });

    if (existingSavedJob) {
      throw new AppError('Job already saved', 400);
    }

    // Create saved job
    const savedJob = new SavedJob({
      candidateId: req.user.candidateProfile,
      jobId,
      savedAt: new Date(),
    });

    await savedJob.save();

    return ApiResponse.success(res, savedJob, 'Job saved successfully');
  }

  /**
   * Unsave job
   */
  async _unsaveJob(jobId, req, res, next) {
    const savedJob = await SavedJob.findOneAndDelete({
      candidateId: req.user.candidateProfile,
      jobId,
    });

    if (!savedJob) {
      throw new AppError('Saved job not found', 404);
    }

    return ApiResponse.success(res, null, 'Saved job removed successfully');
  }
}

module.exports = JobController;
