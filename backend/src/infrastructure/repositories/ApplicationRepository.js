const Application = require('../models/Application');
const IApplicationRepository = require('../../application/recruitment/repositories/IApplicationRepository');

/**
 * ApplicationRepository
 * Infrastructure layer implementation of IApplicationRepository
 */
class ApplicationRepository extends IApplicationRepository {
  async create(applicationData) {
    const application = new Application(applicationData);
    return await application.save();
  }

  async findById(applicationId) {
    return await Application.findById(applicationId)
      .populate('candidateId', 'fullName email avatar')
      .populate('jobId', 'title company location');
  }

  async findByCandidateId(candidateId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const query = { candidateId };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate(
        'jobId',
        'title company location salaryMin salaryMax status deadline'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    return {
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findByJobId(jobId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const query = { jobId };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('candidateId', 'fullName email avatar phone profile.resume')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    return {
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(applicationId, updateData) {
    return await Application.findByIdAndUpdate(applicationId, updateData, {
      new: true,
    });
  }

  async deleteById(applicationId) {
    const result = await Application.findByIdAndDelete(applicationId);
    return !!result;
  }

  async hasCandidateAppliedForJob(candidateId, jobId) {
    const application = await Application.findOne({ candidateId, jobId });
    return !!application;
  }

  async getApplicationStats(jobId) {
    const total = await Application.countDocuments({ jobId });
    const pending = await Application.countDocuments({
      jobId,
      status: 'pending',
    });
    const reviewed = await Application.countDocuments({
      jobId,
      status: 'reviewed',
    });
    const accepted = await Application.countDocuments({
      jobId,
      status: 'accepted',
    });
    const rejected = await Application.countDocuments({
      jobId,
      status: 'rejected',
    });

    return {
      total,
      pending,
      reviewed,
      accepted,
      rejected,
    };
  }

  async count(criteria = {}) {
    return await Application.countDocuments(criteria);
  }
}

module.exports = ApplicationRepository;
