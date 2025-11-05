const Skill = require('../models/Skill');
const ISkillRepository = require('../../domain/master-data/repositories/ISkillRepository');

/**
 * SkillRepository
 * Infrastructure layer implementation of ISkillRepository
 */
class SkillRepository extends ISkillRepository {
  async findById(id) {
    return await Skill.findById(id);
  }

  async findByName(name) {
    return await Skill.findOne({ name: new RegExp(name, 'i') });
  }

  async findByCategory(categoryId) {
    return await Skill.find({ category: categoryId });
  }

  async findAll() {
    return await Skill.find();
  }

  async create(skillData) {
    const skill = new Skill(skillData);
    return await skill.save();
  }

  async update(id, skillData) {
    return await Skill.findByIdAndUpdate(id, skillData, { new: true });
  }

  async delete(id) {
    return await Skill.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await Skill.find({ _id: { $in: ids } });
  }

  async search(query, limit = 10) {
    return await Skill.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
      ],
    }).limit(limit);
  }
}

module.exports = SkillRepository;
