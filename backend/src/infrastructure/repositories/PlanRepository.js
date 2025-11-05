const Plan = require('../models/Plan');

/**
 * PlanRepository
 * Infrastructure layer repository for Plan entity
 */
class PlanRepository {
  async findById(id) {
    return await Plan.findById(id);
  }

  async findByName(name) {
    return await Plan.findOne({ name });
  }

  async findByType(type) {
    return await Plan.find({ type });
  }

  async findAll() {
    return await Plan.find();
  }

  async create(planData) {
    const plan = new Plan(planData);
    return await plan.save();
  }

  async update(id, planData) {
    return await Plan.findByIdAndUpdate(id, planData, { new: true });
  }

  async delete(id) {
    return await Plan.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await Plan.find({ _id: { $in: ids } });
  }

  async findActive() {
    return await Plan.find({ isActive: true });
  }

  async findByPriceRange(minPrice, maxPrice) {
    return await Plan.find({
      price: { $gte: minPrice, $lte: maxPrice },
    });
  }
}

module.exports = PlanRepository;
