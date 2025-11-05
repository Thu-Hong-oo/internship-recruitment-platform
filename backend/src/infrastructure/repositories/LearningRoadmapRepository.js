const LearningRoadmapModel = require('../models/LearningRoadmap');
const LearningRoadmapMapper = require('../mappers/LearningRoadmapMapper');

/**
 * LearningRoadmapRepository
 * Infrastructure layer repository - returns domain entities
 */
class LearningRoadmapRepository {
  /**
   * Find roadmap by ID
   * @param {string} id - Roadmap ID
   * @returns {Promise<LearningRoadmap|null>} Domain entity
   */
  async findById(id) {
    const doc = await LearningRoadmapModel.findById(id);
    return LearningRoadmapMapper.toDomain(doc);
  }

  /**
   * Find all roadmaps by candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array<LearningRoadmap>>} Array of domain entities
   */
  async findByCandidate(candidateId) {
    const docs = await LearningRoadmapModel.find({ candidateId }).sort({
      createdAt: -1,
    });
    return LearningRoadmapMapper.toDomainArray(docs);
  }

  /**
   * Find roadmaps by status
   * @param {string} status - Status (DRAFT, ACTIVE, COMPLETED, ABANDONED)
   * @returns {Promise<Array<LearningRoadmap>>} Array of domain entities
   */
  async findByStatus(status) {
    const docs = await LearningRoadmapModel.find({
      status: status.toLowerCase(),
    }).sort({ updatedAt: -1 });
    return LearningRoadmapMapper.toDomainArray(docs);
  }

  /**
   * Find active roadmaps by candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array<LearningRoadmap>>} Array of domain entities
   */
  async findActiveByCandidate(candidateId) {
    const docs = await LearningRoadmapModel.find({
      candidateId,
      status: 'active',
    }).sort({ startDate: -1 });
    return LearningRoadmapMapper.toDomainArray(docs);
  }

  /**
   * Find completed roadmaps by candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array<LearningRoadmap>>} Array of domain entities
   */
  async findCompletedByCandidate(candidateId) {
    const docs = await LearningRoadmapModel.find({
      candidateId,
      status: 'completed',
    }).sort({ completionDate: -1 });
    return LearningRoadmapMapper.toDomainArray(docs);
  }

  /**
   * Find roadmaps by target job title
   * @param {string} jobTitle - Target job title
   * @returns {Promise<Array<LearningRoadmap>>} Array of domain entities
   */
  async findByTargetJob(jobTitle) {
    const docs = await LearningRoadmapModel.find({
      targetJobTitle: new RegExp(jobTitle, 'i'),
    }).sort({ createdAt: -1 });
    return LearningRoadmapMapper.toDomainArray(docs);
  }

  /**
   * Find roadmaps behind schedule
   * @returns {Promise<Array<LearningRoadmap>>} Array of domain entities
   */
  async findBehindSchedule() {
    // This is a simplified query - in production you'd need complex aggregation
    // For now, we return active roadmaps and filter in application layer
    const docs = await LearningRoadmapModel.find({
      status: 'active',
      startDate: { $ne: null },
    }).sort({ startDate: 1 });
    return LearningRoadmapMapper.toDomainArray(docs);
  }

  /**
   * Find all roadmaps (with pagination)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Array<LearningRoadmap>>} Array of domain entities
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const docs = await LearningRoadmapModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return LearningRoadmapMapper.toDomainArray(docs);
  }

  /**
   * Create new roadmap
   * @param {LearningRoadmap} roadmap - Domain entity
   * @returns {Promise<LearningRoadmap>} Created domain entity
   */
  async create(roadmap) {
    const data = LearningRoadmapMapper.toMongoose(roadmap);
    const doc = new LearningRoadmapModel(data);
    const saved = await doc.save();
    return LearningRoadmapMapper.toDomain(saved);
  }

  /**
   * Update existing roadmap
   * @param {string} id - Roadmap ID
   * @param {LearningRoadmap} roadmap - Domain entity
   * @returns {Promise<LearningRoadmap|null>} Updated domain entity
   */
  async update(id, roadmap) {
    const data = LearningRoadmapMapper.toMongooseUpdate(roadmap);
    const updated = await LearningRoadmapModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return LearningRoadmapMapper.toDomain(updated);
  }

  /**
   * Update roadmap progress
   * @param {string} id - Roadmap ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise<LearningRoadmap|null>} Updated domain entity
   */
  async updateProgress(id, progress) {
    const updated = await LearningRoadmapModel.findByIdAndUpdate(
      id,
      {
        progress,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    return LearningRoadmapMapper.toDomain(updated);
  }

  /**
   * Mark phase as complete
   * @param {string} id - Roadmap ID
   * @param {number} phaseOrder - Phase order number
   * @returns {Promise<LearningRoadmap|null>} Updated domain entity
   */
  async markPhaseComplete(id, phaseOrder) {
    const updated = await LearningRoadmapModel.findOneAndUpdate(
      {
        _id: id,
        'phases.order': phaseOrder,
      },
      {
        $set: {
          'phases.$.isCompleted': true,
          'phases.$.completedAt': new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );
    return LearningRoadmapMapper.toDomain(updated);
  }

  /**
   * Delete roadmap
   * @param {string} id - Roadmap ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await LearningRoadmapModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Count roadmaps by candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<number>} Count
   */
  async countByCandidate(candidateId) {
    return await LearningRoadmapModel.countDocuments({ candidateId });
  }

  /**
   * Count roadmaps by status
   * @param {string} status - Status
   * @returns {Promise<number>} Count
   */
  async countByStatus(status) {
    return await LearningRoadmapModel.countDocuments({
      status: status.toLowerCase(),
    });
  }

  /**
   * Get roadmap statistics for candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(candidateId) {
    const stats = await LearningRoadmapModel.aggregate([
      { $match: { candidateId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress' },
        },
      },
    ]);

    return {
      total: stats.reduce((sum, s) => sum + s.count, 0),
      byStatus: stats.reduce((obj, s) => {
        obj[s._id] = { count: s.count, avgProgress: s.avgProgress };
        return obj;
      }, {}),
    };
  }

  /**
   * Check if roadmap exists
   * @param {string} id - Roadmap ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    const count = await LearningRoadmapModel.countDocuments({ _id: id });
    return count > 0;
  }

  async updateProgress(id, progress) {
    return await LearningRoadmap.findByIdAndUpdate(
      id,
      { progress },
      { new: true }
    );
  }
}

module.exports = LearningRoadmapRepository;
