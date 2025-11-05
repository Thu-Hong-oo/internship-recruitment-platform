/**
 * SubscriptionRepository
 * Infrastructure Layer - Returns domain entities
 */
const SubscriptionModel = require('../models/Subscription');
const SubscriptionMapper = require('../mappers/SubscriptionMapper');

class SubscriptionRepository {
  async findById(id) {
    const doc = await SubscriptionModel.findById(id);
    return SubscriptionMapper.toDomain(doc);
  }

  async findByEmployer(employerId) {
    const doc = await SubscriptionModel.findOne({ employerId }).sort({
      createdAt: -1,
    });
    return SubscriptionMapper.toDomain(doc);
  }

  async findActiveByEmployer(employerId) {
    const doc = await SubscriptionModel.findOne({
      employerId,
      status: 'active',
      endDate: { $gt: new Date() },
    });
    return SubscriptionMapper.toDomain(doc);
  }

  async findByPlan(planId) {
    const docs = await SubscriptionModel.find({ planId });
    return SubscriptionMapper.toDomainArray(docs);
  }

  async findByStatus(status) {
    const docs = await SubscriptionModel.find({
      status: status.toLowerCase(),
    }).sort({ createdAt: -1 });
    return SubscriptionMapper.toDomainArray(docs);
  }

  async findExpiringSoon(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const docs = await SubscriptionModel.find({
      status: 'active',
      endDate: { $lte: futureDate, $gt: new Date() },
    });
    return SubscriptionMapper.toDomainArray(docs);
  }

  async findExpired() {
    const docs = await SubscriptionModel.find({
      status: { $ne: 'expired' },
      endDate: { $lt: new Date() },
    });
    return SubscriptionMapper.toDomainArray(docs);
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const docs = await SubscriptionModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return SubscriptionMapper.toDomainArray(docs);
  }

  async create(subscription) {
    const data = SubscriptionMapper.toMongoose(subscription);
    const doc = new SubscriptionModel(data);
    const saved = await doc.save();
    return SubscriptionMapper.toDomain(saved);
  }

  async update(id, subscription) {
    const data = SubscriptionMapper.toMongooseUpdate(subscription);
    const updated = await SubscriptionModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return SubscriptionMapper.toDomain(updated);
  }

  async delete(id) {
    const result = await SubscriptionModel.findByIdAndDelete(id);
    return result !== null;
  }

  async updateStatus(id, status) {
    const updated = await SubscriptionModel.findByIdAndUpdate(
      id,
      { status: status.toLowerCase(), updatedAt: new Date() },
      { new: true }
    );
    return SubscriptionMapper.toDomain(updated);
  }

  async incrementUsage(id, featureName) {
    const doc = await SubscriptionModel.findById(id);
    if (!doc) return null;

    if (!doc.usage) doc.usage = {};
    doc.usage[featureName] = (doc.usage[featureName] || 0) + 1;
    doc.updatedAt = new Date();

    const saved = await doc.save();
    return SubscriptionMapper.toDomain(saved);
  }

  async resetUsage(id) {
    const updated = await SubscriptionModel.findByIdAndUpdate(
      id,
      { usage: {}, updatedAt: new Date() },
      { new: true }
    );
    return SubscriptionMapper.toDomain(updated);
  }

  async exists(id) {
    const count = await SubscriptionModel.countDocuments({ _id: id });
    return count > 0;
  }

  async countByStatus(status) {
    return await SubscriptionModel.countDocuments({
      status: status.toLowerCase(),
    });
  }

  async countByPlan(planId) {
    return await SubscriptionModel.countDocuments({ planId });
  }
}

module.exports = SubscriptionRepository;
