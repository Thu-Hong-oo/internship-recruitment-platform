const LearningRoadmap = require('../models/LearningRoadmap');

/**
 * LearningRoadmapRepository
 * Infrastructure layer repository for LearningRoadmap entity
 */
class LearningRoadmapRepository {
  async findById(id) {
    return await LearningRoadmap.findById(id);
  }

  async findByUser(userId) {
    return await LearningRoadmap.find({ userId });
  }

  async findByCandidate(candidateId) {
    return await LearningRoadmap.find({ candidateId });
  }

  async findAll() {
    return await LearningRoadmap.find();
  }

  async create(roadmapData) {
    const roadmap = new LearningRoadmap(roadmapData);
    return await roadmap.save();
  }

  async update(id, roadmapData) {
    return await LearningRoadmap.findByIdAndUpdate(id, roadmapData, {
      new: true,
    });
  }

  async delete(id) {
    return await LearningRoadmap.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await LearningRoadmap.find({ _id: { $in: ids } });
  }

  async findByStatus(status) {
    return await LearningRoadmap.find({ status });
  }

  async findBySkill(skillId) {
    return await LearningRoadmap.find({ 'targetSkills.skill': skillId });
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
