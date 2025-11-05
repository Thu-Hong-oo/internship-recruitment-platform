const AiMatchingModel = require('../models/AiMatching');
const AiMatchingMapper = require('../mappers/AiMatchingMapper');

/**
 * AiMatchingRepository
 * Infrastructure layer repository for AiMatching entity
 * Returns domain entities using AiMatchingMapper
 */
class AiMatchingRepository {
  async findById(id) {
    const doc = await AiMatchingModel.findById(id);
    return AiMatchingMapper.toDomain(doc);
  }

  async findByCandidate(candidateId) {
    const docs = await AiMatchingModel.find({ candidateId }).sort({
      createdAt: -1,
    });
    return AiMatchingMapper.toDomainArray(docs);
  }

  async findByJob(jobId) {
    const docs = await AiMatchingModel.find({ jobId }).sort({
      overallScore: -1,
    });
    return AiMatchingMapper.toDomainArray(docs);
  }

  async findByCandidateAndJob(candidateId, jobId) {
    const doc = await AiMatchingModel.findOne({ candidateId, jobId }).sort({
      createdAt: -1,
    });
    return AiMatchingMapper.toDomain(doc);
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const docs = await AiMatchingModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return AiMatchingMapper.toDomainArray(docs);
  }

  async create(entity) {
    const data = AiMatchingMapper.toMongoose(entity);
    const doc = new AiMatchingModel(data);
    const saved = await doc.save();
    return AiMatchingMapper.toDomain(saved);
  }

  async update(id, entity) {
    const data = AiMatchingMapper.toMongooseUpdate(entity);
    const updated = await AiMatchingModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return AiMatchingMapper.toDomain(updated);
  }

  async delete(id) {
    const result = await AiMatchingModel.findByIdAndDelete(id);
    return result !== null;
  }

  async countByCandidate(candidateId) {
    return await AiMatchingModel.countDocuments({ candidateId });
  }

  async countByJob(jobId) {
    return await AiMatchingModel.countDocuments({ jobId });
  }
}

module.exports = AiMatchingRepository;
