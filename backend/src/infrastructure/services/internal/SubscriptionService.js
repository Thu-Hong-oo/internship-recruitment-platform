const SubscriptionRepository = require('../../repositories/SubscriptionRepository');
const PlanRepository = require('../../repositories/PlanRepository');
const UserRepository = require('../../repositories/UserRepository');
const ValidationService = require('./ValidationService');

class SubscriptionService {
  constructor() {
    this.subscriptionRepository = new SubscriptionRepository();
    this.planRepository = new PlanRepository();
    this.userRepository = new UserRepository();
    this.validationService = new ValidationService();
  }

  async createSubscription(subscriptionData) {
    try {
      // Validate subscription data
      const validation =
        this.validationService.validateSubscription(subscriptionData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user exists
      const user = await this.userRepository.findById(subscriptionData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if plan exists
      const plan = await this.planRepository.findById(subscriptionData.planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.subscriptionRepository.findOne({
        userId: subscriptionData.userId,
        status: 'active',
      });

      if (existingSubscription) {
        throw new Error('User already has an active subscription');
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // Create subscription
      const subscription = await this.subscriptionRepository.create({
        ...subscriptionData,
        startDate,
        endDate,
        status: 'active',
      });

      return {
        success: true,
        subscription: {
          id: subscription._id,
          userId: subscription.userId,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          createdAt: subscription.createdAt,
        },
        message: 'Subscription created successfully',
      };
    } catch (error) {
      throw new Error(`Create subscription failed: ${error.message}`);
    }
  }

  async getSubscriptionById(subscriptionId) {
    try {
      const subscription = await this.subscriptionRepository.findById(
        subscriptionId
      );
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      return {
        success: true,
        subscription: {
          id: subscription._id,
          userId: subscription.userId,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get subscription by ID failed: ${error.message}`);
    }
  }

  async updateSubscription(subscriptionId, updateData) {
    try {
      const subscription = await this.subscriptionRepository.findById(
        subscriptionId
      );
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Validate update data
      const validation =
        this.validationService.validateSubscription(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update subscription
      const updatedSubscription = await this.subscriptionRepository.update(
        subscriptionId,
        updateData
      );

      return {
        success: true,
        subscription: {
          id: updatedSubscription._id,
          userId: updatedSubscription.userId,
          planId: updatedSubscription.planId,
          status: updatedSubscription.status,
          startDate: updatedSubscription.startDate,
          endDate: updatedSubscription.endDate,
          updatedAt: updatedSubscription.updatedAt,
        },
        message: 'Subscription updated successfully',
      };
    } catch (error) {
      throw new Error(`Update subscription failed: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.subscriptionRepository.findById(
        subscriptionId
      );
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== 'active') {
        throw new Error('Only active subscriptions can be cancelled');
      }

      // Update subscription status
      const updatedSubscription = await this.subscriptionRepository.update(
        subscriptionId,
        {
          status: 'cancelled',
        }
      );

      return {
        success: true,
        subscription: {
          id: updatedSubscription._id,
          status: updatedSubscription.status,
        },
        message: 'Subscription cancelled successfully',
      };
    } catch (error) {
      throw new Error(`Cancel subscription failed: ${error.message}`);
    }
  }

  async deleteSubscription(subscriptionId) {
    try {
      const subscription = await this.subscriptionRepository.findById(
        subscriptionId
      );
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Soft delete subscription
      await this.subscriptionRepository.softDelete(subscriptionId);

      return {
        success: true,
        message: 'Subscription deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete subscription failed: ${error.message}`);
    }
  }

  async getUserSubscriptions(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, status } = filters;
      const skip = (page - 1) * limit;

      const query = { userId };
      if (status) query.status = status;

      const subscriptions = await this.subscriptionRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['planId'],
      });

      const total = await this.subscriptionRepository.count(query);

      return {
        success: true,
        subscriptions: subscriptions.map(subscription => ({
          id: subscription._id,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          createdAt: subscription.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get user subscriptions failed: ${error.message}`);
    }
  }

  async getActiveSubscription(userId) {
    try {
      const subscription = await this.subscriptionRepository.findOne({
        userId,
        status: 'active',
      });

      if (!subscription) {
        return {
          success: true,
          subscription: null,
          message: 'No active subscription found',
        };
      }

      return {
        success: true,
        subscription: {
          id: subscription._id,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      };
    } catch (error) {
      throw new Error(`Get active subscription failed: ${error.message}`);
    }
  }

  async getAllSubscriptions(filters = {}) {
    try {
      const { page = 1, limit = 20, status, planId } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) query.status = status;
      if (planId) query.planId = planId;

      const subscriptions = await this.subscriptionRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['userId', 'planId'],
      });

      const total = await this.subscriptionRepository.count(query);

      return {
        success: true,
        subscriptions: subscriptions.map(subscription => ({
          id: subscription._id,
          userId: subscription.userId,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          createdAt: subscription.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all subscriptions failed: ${error.message}`);
    }
  }

  async getSubscriptionStats() {
    try {
      const totalSubscriptions = await this.subscriptionRepository.count({});
      const activeSubscriptions = await this.subscriptionRepository.count({
        status: 'active',
      });
      const expiredSubscriptions = await this.subscriptionRepository.count({
        status: 'expired',
      });
      const cancelledSubscriptions = await this.subscriptionRepository.count({
        status: 'cancelled',
      });

      const subscriptionsByPlan = await this.subscriptionRepository.aggregate([
        { $group: { _id: '$planId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        stats: {
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,
          subscriptionsByPlan,
        },
      };
    } catch (error) {
      throw new Error(`Get subscription stats failed: ${error.message}`);
    }
  }

  async checkSubscriptionExpiry() {
    try {
      const today = new Date();
      const expiredSubscriptions = await this.subscriptionRepository.find({
        status: 'active',
        endDate: { $lt: today },
      });

      // Update expired subscriptions
      for (const subscription of expiredSubscriptions) {
        await this.subscriptionRepository.update(subscription._id, {
          status: 'expired',
        });
      }

      return {
        success: true,
        expiredCount: expiredSubscriptions.length,
        message: `Updated ${expiredSubscriptions.length} expired subscriptions`,
      };
    } catch (error) {
      throw new Error(`Check subscription expiry failed: ${error.message}`);
    }
  }

  async renewSubscription(subscriptionId) {
    try {
      const subscription = await this.subscriptionRepository.findById(
        subscriptionId
      );
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== 'active') {
        throw new Error('Only active subscriptions can be renewed');
      }

      // Get plan details
      const plan = await this.planRepository.findById(subscription.planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Calculate new end date
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + plan.duration);

      // Update subscription
      const updatedSubscription = await this.subscriptionRepository.update(
        subscriptionId,
        {
          endDate: newEndDate,
        }
      );

      return {
        success: true,
        subscription: {
          id: updatedSubscription._id,
          endDate: updatedSubscription.endDate,
        },
        message: 'Subscription renewed successfully',
      };
    } catch (error) {
      throw new Error(`Renew subscription failed: ${error.message}`);
    }
  }

  async getSubscriptionHistory(userId) {
    try {
      const subscriptions = await this.subscriptionRepository.find(
        { userId },
        { sort: { createdAt: -1 }, populate: ['planId'] }
      );

      return {
        success: true,
        history: subscriptions.map(subscription => ({
          id: subscription._id,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          createdAt: subscription.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get subscription history failed: ${error.message}`);
    }
  }
}

module.exports = new SubscriptionService();
