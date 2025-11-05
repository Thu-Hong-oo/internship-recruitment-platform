const Subscription = require('../models/Subscription');

/**
 * SubscriptionRepository
 * Infrastructure layer repository for Subscription entity
 */
class SubscriptionRepository {
  async findById(id) {
    return await Subscription.findById(id);
  }

  async findByUser(userId) {
    return await Subscription.find({ userId }).populate('planId');
  }

  async findByPlan(planId) {
    return await Subscription.find({ planId });
  }

  async findActiveByUser(userId) {
    return await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() },
    }).populate('planId');
  }

  async findAll() {
    return await Subscription.find().populate('userId planId');
  }

  async create(subscriptionData) {
    const subscription = new Subscription(subscriptionData);
    return await subscription.save();
  }

  async update(id, subscriptionData) {
    return await Subscription.findByIdAndUpdate(id, subscriptionData, {
      new: true,
    });
  }

  async delete(id) {
    return await Subscription.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await Subscription.find({ _id: { $in: ids } });
  }

  async findByStatus(status) {
    return await Subscription.find({ status });
  }

  async findExpiringSoon(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await Subscription.find({
      status: 'active',
      endDate: { $lte: futureDate, $gt: new Date() },
    }).populate('userId planId');
  }

  async cancel(id) {
    return await Subscription.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
      { new: true }
    );
  }
}

module.exports = SubscriptionRepository;
