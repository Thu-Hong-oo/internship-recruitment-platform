const SavedJobModel = require('../models/SavedJob');
const ISavedJobRepository = require('../../domain/supporting/repositories/ISavedJobRepository');
const SavedJobMapper = require('../mappers/SavedJobMapper');

/**
 * SavedJobRepository
 * Infrastructure layer implementation of ISavedJobRepository
 * Uses SavedJobMapper to convert between domain entities and Mongoose documents
 */
class SavedJobRepository extends ISavedJobRepository {
  async findById(id) {
    const savedJobDoc = await SavedJobModel.findById(id);
    return savedJobDoc ? SavedJobMapper.toDomain(savedJobDoc) : null;
  }

  async findByCandidate(candidateId) {
    const savedJobDocs = await SavedJobModel.find({ candidateId }).populate(
      'jobId'
    );
    return SavedJobMapper.toDomainArray(savedJobDocs);
  }

  async findByJob(jobId) {
    const savedJobDocs = await SavedJobModel.find({ jobId });
    return SavedJobMapper.toDomainArray(savedJobDocs);
  }

  async findAll() {
    const savedJobDocs = await SavedJobModel.find().populate(
      'candidateId jobId'
    );
    return SavedJobMapper.toDomainArray(savedJobDocs);
  }

  async create(savedJobEntity) {
    const savedJobData = SavedJobMapper.toMongoose(savedJobEntity);
    const savedJob = new SavedJobModel(savedJobData);
    const savedDoc = await savedJob.save();
    return SavedJobMapper.toDomain(savedDoc);
  }

  async delete(id) {
    const deletedDoc = await SavedJobModel.findByIdAndDelete(id);
    return deletedDoc ? SavedJobMapper.toDomain(deletedDoc) : null;
  }

  async findByCandidateAndJob(candidateId, jobId) {
    const savedJobDoc = await SavedJobModel.findOne({ candidateId, jobId });
    return savedJobDoc ? SavedJobMapper.toDomain(savedJobDoc) : null;
  }

  async countByJob(jobId) {
    return await SavedJobModel.countDocuments({ jobId });
  }

  async countByCandidate(candidateId) {
    return await SavedJobModel.countDocuments({ candidateId });
  }

  async deleteByCandidateAndJob(candidateId, jobId) {
    const deletedDoc = await SavedJobModel.findOneAndDelete({
      candidateId,
      jobId,
    });
    return deletedDoc ? SavedJobMapper.toDomain(deletedDoc) : null;
  }
}

module.exports = SavedJobRepository;
