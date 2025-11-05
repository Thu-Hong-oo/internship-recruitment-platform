/**
 * PlanRepository
 * Infrastructure Layer - Returns domain entities
 */
const PlanModel = require('../models/Plan');
const PlanMapper = require('../mappers/PlanMapper');

class PlanRepository {
  async findById(id) {
    const doc = await PlanModel.findById(id);
    return PlanMapper.toDomain(doc);
  }

  async findByName(name) {
    const doc = await PlanModel.findOne({ name });
    return PlanMapper.toDomain(doc);
  }

  async findActive() {
    const docs = await PlanModel.find({ isActive: true }).sort({
      sortOrder: 1,
    });
    return PlanMapper.toDomainArray(docs);
  }

  async findAll() {
    const docs = await PlanModel.find().sort({ sortOrder: 1 });
    return PlanMapper.toDomainArray(docs);
  }

  async create(plan) {
    const data = PlanMapper.toMongoose(plan);
    const doc = new PlanModel(data);
    const saved = await doc.save();
    return PlanMapper.toDomain(saved);
  }

  async update(id, plan) {
    const data = PlanMapper.toMongooseUpdate(plan);
    const updated = await PlanModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return PlanMapper.toDomain(updated);
  }

  async delete(id) {
    const result = await PlanModel.findByIdAndDelete(id);
    return result !== null;
  }

  async activate(id) {
    const updated = await PlanModel.findByIdAndUpdate(
      id,
      { isActive: true, updatedAt: new Date() },
      { new: true }
    );
    return PlanMapper.toDomain(updated);
  }

  async deactivate(id) {
    const updated = await PlanModel.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    return PlanMapper.toDomain(updated);
  }

  async exists(id) {
    const count = await PlanModel.countDocuments({ _id: id });
    return count > 0;
  }

  async countActive() {
    return await PlanModel.countDocuments({ isActive: true });
  }
}

module.exports = PlanRepository;
