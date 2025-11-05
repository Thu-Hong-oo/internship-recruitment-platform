const JobModel = require('../models/JobPost');
const IJobRepository = require('../../application/recruitment/repositories/IJobRepository');
const JobPostingMapper = require('../mappers/JobPostingMapper');

/**
 * JobRepository
 * Infrastructure layer implementation of IJobRepository
 * Converts between JobPosting Domain Entities and Mongoose Models
 */
class JobRepository extends IJobRepository {
  async create(jobData) {
    // jobData can be either Domain Entity or plain object
    const mongooseData =
      jobData.constructor.name === 'JobPosting'
        ? JobPostingMapper.toMongoose(jobData)
        : jobData;

    const doc = new JobModel(mongooseData);
    await doc.save();
    return JobPostingMapper.toDomain(doc);
  }

  async findById(jobId) {
    const doc = await JobModel.findById(jobId)
      .populate(
        'employer',
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress'
      )
      .populate('postedBy', 'fullName name email avatar');
    return JobPostingMapper.toDomain(doc);
  }

  async findBySlug(slug) {
    const doc = await JobModel.findOne({ slug })
      .populate(
        'employer',
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress'
      )
      .populate('postedBy', 'fullName name email avatar');
    return JobPostingMapper.toDomain(doc);
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

    const jobDocs = await JobModel.find(query)
      .populate(
        'employer',
        'company.name company.logo company.industry company.description company.website company.size company.officeAddress'
      )
      .populate('postedBy', 'fullName name email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobModel.countDocuments(query);

    // Convert to domain entities
    const jobs = jobDocs.map(doc => JobPostingMapper.toDomain(doc));

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
    const doc = await JobModel.findByIdAndUpdate(jobId, updateData, {
      new: true,
    });
    return doc ? JobPostingMapper.toDomain(doc) : null;
  }

  async deleteById(jobId) {
    const result = await JobModel.findByIdAndDelete(jobId);
    return !!result;
  }

  async findByEmployerId(employerId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const jobDocs = await JobModel.find({ employerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobModel.countDocuments({ employerId });

    // Convert to domain entities
    const jobs = jobDocs.map(doc => JobPostingMapper.toDomain(doc));

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
    const docs = await JobModel.find({
      employerId,
      status: 'draft',
    }).sort({ createdAt: -1 });

    return docs.map(doc => JobPostingMapper.toDomain(doc));
  }

  async findRecent(limit = 10) {
    const docs = await JobModel.find({ status: 'published' })
      .populate('employer', 'company.name company.logo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return docs.map(doc => JobPostingMapper.toDomain(doc));
  }

  async getJobApplications(jobId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const jobDoc = await JobModel.findById(jobId).populate({
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

    if (!jobDoc) return null;

    const total = jobDoc.applications.length;

    // Note: applications are not domain entities yet, return as-is
    // Will be converted when Application domain entity is created
    return {
      applications: jobDoc.applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getJobStats(jobId) {
    const jobDoc = await JobModel.findById(jobId);
    if (!jobDoc) return null;

    const applicationsCount = await JobModel.countDocuments({
      _id: jobId,
      'applications.0': { $exists: true },
    });
    const viewsCount = jobDoc.views || 0;

    return {
      applicationsCount,
      viewsCount,
      status: jobDoc.status,
      createdAt: jobDoc.createdAt,
    };
  }

  async incrementViews(jobId) {
    const doc = await JobModel.findByIdAndUpdate(
      jobId,
      { $inc: { views: 1 } },
      { new: true }
    );
    return doc ? JobPostingMapper.toDomain(doc) : null;
  }

  async submitForReview(jobId) {
    const doc = await JobModel.findByIdAndUpdate(
      jobId,
      { status: 'pending_review' },
      { new: true }
    );
    return doc ? JobPostingMapper.toDomain(doc) : null;
  }

  async count(criteria = {}) {
    return await JobModel.countDocuments(criteria);
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
