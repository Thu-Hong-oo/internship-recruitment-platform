/**
 * PlanService - Handles subscription plan operations
 * Dependencies injected via constructor for proper DI
 */
class PlanService {
  constructor(
    planRepository,
    subscriptionRepository,
    userRepository,
    validationService
  ) {
    this.planRepository = planRepository;
    this.subscriptionRepository = subscriptionRepository;
    this.userRepository = userRepository;
    this.validationService = validationService;
  }

  async createPlan(planData) {
    try {
      // Validate plan data
      const validation = this.validationService.validatePlan(planData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if plan already exists
      const existingPlan = await this.planRepository.findOne({
        name: planData.name,
      });

      if (existingPlan) {
        throw new Error('Plan with this name already exists');
      }

      // Create plan
      const plan = await this.planRepository.create(planData);

      return {
        success: true,
        plan: {
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
          isActive: plan.isActive,
          createdAt: plan.createdAt,
        },
        message: 'Plan created successfully',
      };
    } catch (error) {
      throw new Error(`Create plan failed: ${error.message}`);
    }
  }

  async getPlanById(planId) {
    try {
      const plan = await this.planRepository.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      return {
        success: true,
        plan: {
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
          isActive: plan.isActive,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get plan by ID failed: ${error.message}`);
    }
  }

  async updatePlan(planId, updateData) {
    try {
      const plan = await this.planRepository.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Validate update data
      const validation = this.validationService.validatePlan(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update plan
      const updatedPlan = await this.planRepository.update(planId, updateData);

      return {
        success: true,
        plan: {
          id: updatedPlan._id,
          name: updatedPlan.name,
          description: updatedPlan.description,
          price: updatedPlan.price,
          duration: updatedPlan.duration,
          features: updatedPlan.features,
          isActive: updatedPlan.isActive,
          updatedAt: updatedPlan.updatedAt,
        },
        message: 'Plan updated successfully',
      };
    } catch (error) {
      throw new Error(`Update plan failed: ${error.message}`);
    }
  }

  async deletePlan(planId) {
    try {
      const plan = await this.planRepository.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Check if plan has active subscriptions
      const activeSubscriptions = await this.subscriptionRepository.count({
        planId,
        status: 'active',
      });

      if (activeSubscriptions > 0) {
        throw new Error('Cannot delete plan with active subscriptions');
      }

      // Soft delete plan
      await this.planRepository.softDelete(planId);

      return {
        success: true,
        message: 'Plan deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete plan failed: ${error.message}`);
    }
  }

  async getAllPlans(filters = {}) {
    try {
      const { page = 1, limit = 20, isActive, search } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (isActive !== undefined) query.isActive = isActive;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const plans = await this.planRepository.find(query, {
        skip,
        limit,
        sort: { price: 1 },
      });

      const total = await this.planRepository.count(query);

      return {
        success: true,
        plans: plans.map(plan => ({
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
          isActive: plan.isActive,
          createdAt: plan.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all plans failed: ${error.message}`);
    }
  }

  async getActivePlans() {
    try {
      const plans = await this.planRepository.find(
        { isActive: true },
        { sort: { price: 1 } }
      );

      return {
        success: true,
        plans: plans.map(plan => ({
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
        })),
      };
    } catch (error) {
      throw new Error(`Get active plans failed: ${error.message}`);
    }
  }

  async getPlanStats(planId) {
    try {
      const plan = await this.planRepository.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Get plan statistics
      const totalSubscriptions = await this.subscriptionRepository.count({
        planId,
      });

      const activeSubscriptions = await this.subscriptionRepository.count({
        planId,
        status: 'active',
      });

      const expiredSubscriptions = await this.subscriptionRepository.count({
        planId,
        status: 'expired',
      });

      return {
        success: true,
        stats: {
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
        },
      };
    } catch (error) {
      throw new Error(`Get plan stats failed: ${error.message}`);
    }
  }

  async getPlanSubscriptions(planId, filters = {}) {
    try {
      const plan = await this.planRepository.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const { page = 1, limit = 20, status } = filters;
      const skip = (page - 1) * limit;

      const query = { planId };
      if (status) query.status = status;

      const subscriptions = await this.subscriptionRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['userId'],
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
      throw new Error(`Get plan subscriptions failed: ${error.message}`);
    }
  }

  async searchPlans(searchQuery) {
    try {
      const plans = await this.planRepository.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
        ],
        isActive: true,
      });

      return {
        success: true,
        plans: plans.map(plan => ({
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
        })),
      };
    } catch (error) {
      throw new Error(`Search plans failed: ${error.message}`);
    }
  }

  async getPlanFeatures(planId) {
    try {
      const plan = await this.planRepository.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      return {
        success: true,
        features: plan.features,
      };
    } catch (error) {
      throw new Error(`Get plan features failed: ${error.message}`);
    }
  }

  async comparePlans(planIds) {
    try {
      const plans = await this.planRepository.find({
        _id: { $in: planIds },
        isActive: true,
      });

      if (plans.length === 0) {
        throw new Error('No plans found');
      }

      return {
        success: true,
        plans: plans.map(plan => ({
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
        })),
      };
    } catch (error) {
      throw new Error(`Compare plans failed: ${error.message}`);
    }
  }

  async getPlanRecommendations(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's current subscription
      const currentSubscription = await this.subscriptionRepository.findOne({
        userId,
        status: 'active',
      });

      // Get all active plans
      const plans = await this.planRepository.find(
        { isActive: true },
        { sort: { price: 1 } }
      );

      // Filter out current plan
      const availablePlans = plans.filter(
        plan =>
          !currentSubscription ||
          plan._id.toString() !== currentSubscription.planId.toString()
      );

      return {
        success: true,
        recommendations: availablePlans.map(plan => ({
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
        })),
      };
    } catch (error) {
      throw new Error(`Get plan recommendations failed: ${error.message}`);
    }
  }
}

module.exports = PlanService;
