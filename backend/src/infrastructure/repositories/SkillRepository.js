const SkillModel = require('../models/Skill');
const ISkillRepository = require('../../domain/master-data/repositories/ISkillRepository');
const SkillMapper = require('../mappers/SkillMapper');

/**
 * SkillRepository
 * Infrastructure layer implementation of ISkillRepository
 * Uses SkillMapper to convert between domain entities and Mongoose documents
 */
class SkillRepository extends ISkillRepository {
  async findById(id) {
    const skillDoc = await SkillModel.findById(id);
    return skillDoc ? SkillMapper.toDomain(skillDoc) : null;
  }

  async findByName(name) {
    const skillDoc = await SkillModel.findOne({ name: new RegExp(name, 'i') });
    return skillDoc ? SkillMapper.toDomain(skillDoc) : null;
  }

  async findBySlug(slug) {
    const skillDoc = await SkillModel.findOne({ slug });
    return skillDoc ? SkillMapper.toDomain(skillDoc) : null;
  }

  async findByParentId(parentId) {
    const skillDocs = await SkillModel.find({ parentId });
    return SkillMapper.toDomainArray(skillDocs);
  }

  async findAll() {
    const skillDocs = await SkillModel.find();
    return SkillMapper.toDomainArray(skillDocs);
  }

  async findActive() {
    const skillDocs = await SkillModel.find({ isActive: true });
    return SkillMapper.toDomainArray(skillDocs);
  }

  async create(skillEntity) {
    const skillData = SkillMapper.toMongoose(skillEntity);
    const skill = new SkillModel(skillData);
    const savedDoc = await skill.save();
    return SkillMapper.toDomain(savedDoc);
  }

  async update(id, skillEntity) {
    const skillData = SkillMapper.toMongoose(skillEntity);
    const updatedDoc = await SkillModel.findByIdAndUpdate(id, skillData, {
      new: true,
    });
    return updatedDoc ? SkillMapper.toDomain(updatedDoc) : null;
  }

  async delete(id) {
    const deletedDoc = await SkillModel.findByIdAndDelete(id);
    return deletedDoc ? SkillMapper.toDomain(deletedDoc) : null;
  }

  async findByIds(ids) {
    const skillDocs = await SkillModel.find({ _id: { $in: ids } });
    return SkillMapper.toDomainArray(skillDocs);
  }

  async search(query, limit = 10) {
    const skillDocs = await SkillModel.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
      ],
    }).limit(limit);
    return SkillMapper.toDomainArray(skillDocs);
  }

  async findByDemandLevel(level) {
    const skillDocs = await SkillModel.find({ demandLevel: level });
    return SkillMapper.toDomainArray(skillDocs);
  }

  async findTrending() {
    const skillDocs = await SkillModel.find({
      trend: { $in: ['growing', 'emerging'] },
    }).sort({ popularity: -1 });
    return SkillMapper.toDomainArray(skillDocs);
  }
}

module.exports = SkillRepository;
