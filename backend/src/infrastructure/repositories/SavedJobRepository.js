const SavedJob = require('../models/SavedJob');
const ISavedJobRepository = require('../../domain/supporting/repositories/ISavedJobRepository');

/**
 * SavedJobRepository
 * Infrastructure layer implementation of ISavedJobRepository
 */
class SavedJobRepository extends ISavedJobRepository {
  async findById(id) {
    return await SavedJob.findById(id);
  }

  async findByUser(userId) {
    return await SavedJob.find({ userId }).populate('jobId');
  }

  async findByJob(jobId) {
    return await SavedJob.find({ jobId });
  }

  async findAll() {
    return await SavedJob.find().populate('userId jobId');
  }

  async create(savedJobData) {
    const savedJob = new SavedJob(savedJobData);
    return await savedJob.save();
  }

  async delete(id) {
    return await SavedJob.findByIdAndDelete(id);
  }

  async findByUserAndJob(userId, jobId) {
    return await SavedJob.findOne({ userId, jobId });
  }

  async countByJob(jobId) {
    return await SavedJob.countDocuments({ jobId });
  }

  async countByUser(userId) {
    return await SavedJob.countDocuments({ userId });
  }

  async deleteByUserAndJob(userId, jobId) {
    return await SavedJob.findOneAndDelete({ userId, jobId });
  }
}

module.exports = SavedJobRepository;
