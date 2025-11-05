/**
 * SubscriptionMapper - Pure transformation between Mongoose and Domain
 * Handles: usage tracking object, payment method object
 */

const Subscription = require('../../domain/subscription/Subscription');

class SubscriptionMapper {
  /**
   * Convert Mongoose document to Subscription domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Subscription|null} Domain entity
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    try {
      // Handle usage object
      const usage = {
        jobPostings: mongooseDoc.usage?.jobPostings || 0,
        applications: mongooseDoc.usage?.applications || 0,
        aiMatchings: mongooseDoc.usage?.aiMatchings || 0,
      };

      // Handle payment method object
      const paymentMethod = mongooseDoc.paymentMethod
        ? {
            type: mongooseDoc.paymentMethod.type,
            last4: mongooseDoc.paymentMethod.last4 || null,
            expiryMonth: mongooseDoc.paymentMethod.expiryMonth || null,
            expiryYear: mongooseDoc.paymentMethod.expiryYear || null,
          }
        : null;

      return new Subscription(
        mongooseDoc._id?.toString(),
        mongooseDoc.employerId?.toString(),
        mongooseDoc.planId?.toString(),
        mongooseDoc.status ? mongooseDoc.status.toUpperCase() : 'PENDING',
        mongooseDoc.startDate,
        mongooseDoc.endDate,
        mongooseDoc.autoRenew || false,
        usage,
        paymentMethod,
        mongooseDoc.lastPaymentDate || null,
        mongooseDoc.nextPaymentDate || null,
        mongooseDoc.canceledAt || null,
        mongooseDoc.metadata || null,
        mongooseDoc.createdAt,
        mongooseDoc.updatedAt
      );
    } catch (error) {
      console.error('Error mapping Subscription to domain:', error);
      return null;
    }
  }

  /**
   * Convert Subscription domain entity to Mongoose data
   * @param {Subscription} domainEntity - Domain entity
   * @returns {Object} Mongoose data
   */
  static toMongoose(domainEntity) {
    if (!domainEntity) return null;

    const data = {
      employerId: domainEntity.employerId,
      planId: domainEntity.planId,
      status: domainEntity.status.toLowerCase(),
      startDate: domainEntity.startDate,
      endDate: domainEntity.endDate,
      autoRenew: domainEntity.autoRenew,
      usage: {
        jobPostings: domainEntity.usage.jobPostings,
        applications: domainEntity.usage.applications,
        aiMatchings: domainEntity.usage.aiMatchings,
      },
      lastPaymentDate: domainEntity.lastPaymentDate,
      nextPaymentDate: domainEntity.nextPaymentDate,
      canceledAt: domainEntity.canceledAt,
      metadata: domainEntity.metadata,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };

    // Only include payment method if it exists
    if (domainEntity.paymentMethod) {
      data.paymentMethod = {
        type: domainEntity.paymentMethod.type,
        last4: domainEntity.paymentMethod.last4,
        expiryMonth: domainEntity.paymentMethod.expiryMonth,
        expiryYear: domainEntity.paymentMethod.expiryYear,
      };
    }

    return data;
  }

  /**
   * Convert for Mongoose update (excludes immutable fields)
   * @param {Subscription} domainEntity - Domain entity
   * @returns {Object} Update data
   */
  static toMongooseUpdate(domainEntity) {
    const data = this.toMongoose(domainEntity);

    // Remove immutable fields
    delete data.employerId;
    delete data.createdAt;

    return data;
  }

  /**
   * Convert array of Mongoose documents to domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<Subscription>} Array of domain entities
   */
  static toDomainArray(mongooseDocs) {
    if (!Array.isArray(mongooseDocs)) return [];

    return mongooseDocs
      .map(doc => this.toDomain(doc))
      .filter(entity => entity !== null);
  }

  /**
   * Convert to lightweight preview (for lists)
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Object|null} Preview object
   */
  static toPreview(mongooseDoc) {
    if (!mongooseDoc) return null;

    // Calculate days remaining
    let daysRemaining = null;
    if (mongooseDoc.endDate) {
      const now = new Date();
      const end = new Date(mongooseDoc.endDate);
      daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    }

    return {
      id: mongooseDoc._id?.toString(),
      employerId: mongooseDoc.employerId?.toString(),
      planId: mongooseDoc.planId?.toString(),
      status: mongooseDoc.status ? mongooseDoc.status.toUpperCase() : 'PENDING',
      startDate: mongooseDoc.startDate,
      endDate: mongooseDoc.endDate,
      daysRemaining,
      autoRenew: mongooseDoc.autoRenew || false,
      totalUsage:
        (mongooseDoc.usage?.jobPostings || 0) +
        (mongooseDoc.usage?.applications || 0) +
        (mongooseDoc.usage?.aiMatchings || 0),
      lastPaymentDate: mongooseDoc.lastPaymentDate,
      nextPaymentDate: mongooseDoc.nextPaymentDate,
      createdAt: mongooseDoc.createdAt,
      updatedAt: mongooseDoc.updatedAt,
    };
  }
}

module.exports = SubscriptionMapper;
