const ApplicationModel = require('../models/Application');
const IApplicationRepository = require('../../application/recruitment/repositories/IApplicationRepository');
const ApplicationMapper = require('../mappers/ApplicationMapper');

/**
 * ApplicationRepository
 * Infrastructure layer implementation of IApplicationRepository
 * Converts between Application Domain Entities and Mongoose Models
 */
class ApplicationRepository extends IApplicationRepository {
  async create(applicationData) {
    // applicationData can be either Domain Entity or plain object
    const mongooseData =
      applicationData.constructor.name === 'Application'
        ? ApplicationMapper.toMongoose(applicationData)
        : applicationData;

    const doc = new ApplicationModel(mongooseData);
    await doc.save();
    return ApplicationMapper.toDomain(doc);
  }

  async findById(applicationId) {
    const doc = await ApplicationModel.findById(applicationId)
      .populate('candidateId', 'fullName email avatar')
      .populate('jobId', 'title company location');
    return ApplicationMapper.toDomain(doc);
  }

  async findByCandidateId(candidateId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const query = { candidateId };
    if (status) {
      query.status = status;
    }

    const docs = await ApplicationModel.find(query)
      .populate(
        'jobId',
        'title company location salaryMin salaryMax status deadline'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationModel.countDocuments(query);

    // Convert to domain entities
    const applications = docs.map(doc => ApplicationMapper.toDomain(doc));

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

    const docs = await ApplicationModel.find(query)
      .populate('candidateId', 'fullName email avatar phone profile.resume')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationModel.countDocuments(query);

    // Convert to domain entities
    const applications = docs.map(doc => ApplicationMapper.toDomain(doc));

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
    const doc = await ApplicationModel.findByIdAndUpdate(
      applicationId,
      updateData,
      {
        new: true,
      }
    );
    return ApplicationMapper.toDomain(doc);
  }

  async deleteById(applicationId) {
    const result = await ApplicationModel.findByIdAndDelete(applicationId);
    return !!result;
  }

  async hasCandidateAppliedForJob(candidateId, jobId) {
    const doc = await ApplicationModel.findOne({ candidateId, jobId });
    return !!doc;
  }

  async getApplicationStats(jobId) {
    const total = await ApplicationModel.countDocuments({ jobId });
    const pending = await ApplicationModel.countDocuments({
      jobId,
      status: 'pending',
    });
    const reviewed = await ApplicationModel.countDocuments({
      jobId,
      status: 'reviewed',
    });
    const accepted = await ApplicationModel.countDocuments({
      jobId,
      status: 'accepted',
    });
    const rejected = await ApplicationModel.countDocuments({
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
