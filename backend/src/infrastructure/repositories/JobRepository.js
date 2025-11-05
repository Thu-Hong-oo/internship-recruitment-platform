const Job = require('../models/JobPost');
const IJobRepository = require('../../application/recruitment/repositories/IJobRepository');

/**
 * JobRepository
 * Infrastructure layer implementation of IJobRepository
 */
class JobRepository extends IJobRepository {
  async create(jobData) {
    const job = new Job(jobData);
    return await job.save();
  }

  async findById(jobId) {
    return await Job.findById(jobId)
      .populate(
        'employer',
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress'
      )
      .populate('postedBy', 'fullName name email avatar');
  }

  async findBySlug(slug) {
    return await Job.findOne({ slug })
      .populate(
        'employer',
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress'
      )
      .populate('postedBy', 'fullName name email avatar');
  }

  async findAll(filters, options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;
    const skip = (page - 1) * limit;

    // Build query from filters
    const query = this.buildQuery(filters);

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate(
        'employer',
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress'
      )
      .populate('postedBy', 'fullName name email avatar')
      .sort(sortObj)
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
      filters: {
        appliedFilters: Object.keys(query).length,
        availableFilters: this.getAvailableFilters(filters),
      },
    };
  }

  async updateById(jobId, updateData) {
    return await Job.findByIdAndUpdate(jobId, updateData, { new: true });
  }

  async deleteById(jobId) {
    const result = await Job.findByIdAndDelete(jobId);
    return !!result;
  }

  async findByEmployerId(employerId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({ employerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({ employerId });

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

  async findDraftByEmployerId(employerId) {
    return await Job.find({
      employerId,
      status: 'draft',
    }).sort({ createdAt: -1 });
  }

  async findRecent(limit = 10) {
    return await Job.find({ status: 'published' })
      .populate('employer', 'company.name company.logo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
  }

  async getJobApplications(jobId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const job = await Job.findById(jobId).populate({
      path: 'applications',
      options: {
        skip,
        limit: parseInt(limit),
        sort: { createdAt: -1 },
      },
      populate: {
        path: 'candidate',
        select: 'fullName email avatar',
      },
    });

    if (!job) return null;

    const total = job.applications.length;

    return {
      applications: job.applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getJobStats(jobId) {
    const job = await Job.findById(jobId);
    if (!job) return null;

    const applicationsCount = await Job.countDocuments({
      _id: jobId,
      'applications.0': { $exists: true },
    });
    const viewsCount = job.views || 0;

    return {
      applicationsCount,
      viewsCount,
      status: job.status,
      createdAt: job.createdAt,
    };
  }

  async incrementViews(jobId) {
    return await Job.findByIdAndUpdate(
      jobId,
      { $inc: { views: 1 } },
      { new: true }
    );
  }

  async submitForReview(jobId) {
    return await Job.findByIdAndUpdate(
      jobId,
      { status: 'pending_review' },
      { new: true }
    );
  }

  async count(criteria = {}) {
    return await Job.countDocuments(criteria);
  }

  /**
   * Build MongoDB query from filters
   */
  buildQuery(filters) {
    const query = {};

    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    if (filters.location) {
      query['location'] = { $regex: filters.location, $options: 'i' };
    }

    if (filters.skills) {
      const skillArray = filters.skills.split(',').map(skill => skill.trim());
      query['skills'] = { $in: skillArray };
    }

    if (filters.status) {
      query['status'] = filters.status;
    }

    if (filters.jobType) {
      query['jobType'] = filters.jobType;
    }

    if (filters.industryCode) {
      query.industryPath = filters.industryCode;
    }

    if (filters.category) {
      query['category'] = { $regex: filters.category, $options: 'i' };
    }

    if (filters.salaryMin || filters.salaryMax) {
      query['salaryMin'] = {};
      if (filters.salaryMin)
        query['salaryMin'].$gte = Number(filters.salaryMin);
      if (filters.salaryMax)
        query['salaryMin'].$lte = Number(filters.salaryMax);
    }

    if (filters.createdFrom || filters.createdTo) {
      query['createdAt'] = {};
      if (filters.createdFrom)
        query['createdAt'].$gte = new Date(filters.createdFrom);
      if (filters.createdTo)
        query['createdAt'].$lte = new Date(filters.createdTo);
    }

    if (filters.deadlineFrom || filters.deadlineTo) {
      query['deadline'] = {};
      if (filters.deadlineFrom)
        query['deadline'].$gte = new Date(filters.deadlineFrom);
      if (filters.deadlineTo)
        query['deadline'].$lte = new Date(filters.deadlineTo);
    }

    if (filters.tags) {
      const tagArray = filters.tags.split(',').map(tag => tag.trim());
      query['tags'] = { $in: tagArray };
    }

    // Remove undefined filters
    Object.keys(query).forEach(key => {
      if (
        query[key] === undefined ||
        (typeof query[key] === 'object' && Object.keys(query[key]).length === 0)
      ) {
        delete query[key];
      }
    });

    return query;
  }

  /**
   * Get available filters info
   */
  getAvailableFilters(appliedFilters) {
    return {
      location: !!appliedFilters.location,
      skills: !!appliedFilters.skills,
      status: !!appliedFilters.status,
      jobType: !!appliedFilters.jobType,
      category: !!appliedFilters.category,
      salaryMin: !!appliedFilters.salaryMin,
      salaryMax: !!appliedFilters.salaryMax,
      createdFrom: !!appliedFilters.createdFrom,
      createdTo: !!appliedFilters.createdTo,
      deadlineFrom: !!appliedFilters.deadlineFrom,
      deadlineTo: !!appliedFilters.deadlineTo,
      tags: !!appliedFilters.tags,
    };
  }
}

module.exports = JobRepository;
