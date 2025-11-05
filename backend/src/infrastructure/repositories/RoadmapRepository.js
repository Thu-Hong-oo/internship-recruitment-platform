const SkillRoadmap = require('../models/LearningRoadmap');
const IRoadmapRepository = require('../../domain/skill-development/repositories/ISkillRoadmapRepository');

/**
 * RoadmapRepository
 * Infrastructure layer implementation of IRoadmapRepository
 */
class RoadmapRepository extends IRoadmapRepository {
  async findById(id) {
    return await SkillRoadmap.findById(id);
  }

  async findByUser(userId) {
    return await SkillRoadmap.find({ userId });
  }

  async findBySkill(skillId) {
    return await SkillRoadmap.find({ 'skills.skill': skillId });
  }

  async findAll() {
    return await SkillRoadmap.find();
  }

  async create(roadmapData) {
    const roadmap = new SkillRoadmap(roadmapData);
    return await roadmap.save();
  }

  async update(id, roadmapData) {
    return await SkillRoadmap.findByIdAndUpdate(id, roadmapData, { new: true });
  }

  async delete(id) {
    return await SkillRoadmap.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await SkillRoadmap.find({ _id: { $in: ids } });
  }

  async findByStatus(status) {
    return await SkillRoadmap.find({ status });
  }

  async findByProgressRange(minProgress, maxProgress) {
    return await SkillRoadmap.find({
      'progress.overall': { $gte: minProgress, $lte: maxProgress },
    });
  }
}

module.exports = RoadmapRepository;
