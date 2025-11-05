/**
 * Subscription Domain Entity
 * Represents an employer's subscription to a plan
 *
 * Business Rules:
 * - One subscription per employer at a time
 * - Must reference a valid plan
 * - Auto-renewal is opt-in
 * - Cannot cancel already expired subscription
 * - Usage tracking for plan limits
 * - Grace period after expiration before cancellation
 */

const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
  PAUSED: 'PAUSED',
  PENDING: 'PENDING', // Waiting for payment
};

class Subscription {
  constructor(
    id,
    ownerId,
    planCode,
    status,
    startDate,
    endDate,
    autoRenew = true,
    usage = null,
    paymentMethod = null,
    canceledAt = null,
    cancelReason = null,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.planCode = planCode;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.autoRenew = autoRenew;
    this.usage = usage || {};
    this.paymentMethod = paymentMethod;
    this.canceledAt = canceledAt;
    this.cancelReason = cancelReason;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    if (!this.id) {
      throw new Error('Subscription ID is required');
    }

    if (!this.ownerId) {
      throw new Error('Owner ID is required');
    }

    if (!this.planCode) {
      throw new Error('Plan code is required');
    }

    if (
      !this.status ||
      !Object.values(SubscriptionStatus).includes(this.status)
    ) {
      throw new Error('Valid status is required');
    }

    if (!this.startDate) {
      throw new Error('Start date is required');
    }

    if (!this.endDate) {
      throw new Error('End date is required');
    }

    if (this.endDate <= this.startDate) {
      throw new Error('End date must be after start date');
    }

    if (typeof this.autoRenew !== 'boolean') {
      throw new Error('Auto-renew must be a boolean');
    }

    if (typeof this.usage !== 'object' || this.usage === null) {
      throw new Error('Usage must be an object');
    }
  }

  // ============================================
  // Status Management
  // ============================================

  activate() {
    if (this.status === SubscriptionStatus.ACTIVE) {
      return; // Already active
    }

    if (this.isExpired()) {
      throw new Error('Cannot activate expired subscription');
    }

    this.status = SubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  cancel(reason = null) {
    if (this.status === SubscriptionStatus.CANCELED) {
      throw new Error('Subscription already canceled');
    }

    if (this.status === SubscriptionStatus.EXPIRED) {
      throw new Error('Cannot cancel expired subscription');
    }

    this.status = SubscriptionStatus.CANCELED;
    this.canceledAt = new Date();
    this.cancelReason = reason;
    this.autoRenew = false;
    this.updatedAt = new Date();
  }

  pause() {
    if (this.status !== SubscriptionStatus.ACTIVE) {
      throw new Error('Can only pause active subscription');
    }

    this.status = SubscriptionStatus.PAUSED;
    this.updatedAt = new Date();
  }

  resume() {
    if (this.status !== SubscriptionStatus.PAUSED) {
      throw new Error('Can only resume paused subscription');
    }

    if (this.isExpired()) {
      throw new Error('Cannot resume expired subscription');
    }

    this.status = SubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  expire() {
    if (this.status === SubscriptionStatus.EXPIRED) {
      return; // Already expired
    }

    this.status = SubscriptionStatus.EXPIRED;
    this.autoRenew = false;
    this.updatedAt = new Date();
  }

  isActive() {
    return this.status === SubscriptionStatus.ACTIVE && !this.isExpired();
  }

  isCanceled() {
    return this.status === SubscriptionStatus.CANCELED;
  }

  isExpired() {
    return (
      this.status === SubscriptionStatus.EXPIRED || new Date() > this.endDate
    );
  }

  isPaused() {
    return this.status === SubscriptionStatus.PAUSED;
  }

  isPending() {
    return this.status === SubscriptionStatus.PENDING;
  }

  // ============================================
  // Auto-Renewal Management
  // ============================================

  enableAutoRenew() {
    if (this.autoRenew) {
      return; // Already enabled
    }

    if (this.isCanceled() || this.isExpired()) {
      throw new Error(
        'Cannot enable auto-renew for canceled or expired subscription'
      );
    }

    this.autoRenew = true;
    this.updatedAt = new Date();
  }

  disableAutoRenew() {
    if (!this.autoRenew) {
      return; // Already disabled
    }

    this.autoRenew = false;
    this.updatedAt = new Date();
  }

  shouldAutoRenew() {
    return this.autoRenew && this.isActive() && !this.isCanceled();
  }

  // ============================================
  // Date Management
  // ============================================

  getDaysRemaining() {
    if (this.isExpired()) {
      return 0;
    }

    const now = new Date();
    const remaining = this.endDate - now;
    return Math.ceil(remaining / (1000 * 60 * 60 * 24));
  }

  getDaysActive() {
    const now = new Date();
    const start = this.startDate;
    const end = this.isExpired() ? this.endDate : now;

    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  }

  getDuration() {
    return Math.floor((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(days = 7) {
    if (this.isExpired()) {
      return false;
    }

    return this.getDaysRemaining() <= days;
  }

  extendSubscription(additionalDays) {
    if (additionalDays <= 0) {
      throw new Error('Additional days must be positive');
    }

    const newEndDate = new Date(this.endDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    this.endDate = newEndDate;
    this.updatedAt = new Date();

    // Reactivate if was expired
    if (this.status === SubscriptionStatus.EXPIRED) {
      this.status = SubscriptionStatus.ACTIVE;
    }
  }

  renew(newEndDate) {
    if (!newEndDate) {
      throw new Error('New end date is required');
    }

    if (newEndDate <= this.endDate) {
      throw new Error('New end date must be after current end date');
    }

    this.startDate = this.endDate;
    this.endDate = newEndDate;
    this.status = SubscriptionStatus.ACTIVE;
    this.resetUsage();
    this.updatedAt = new Date();
  }

  // ============================================
  // Usage Tracking
  // ============================================

  trackUsage(metricName, value) {
    if (!metricName) {
      throw new Error('Metric name is required');
    }

    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }

    this.usage[metricName] = value;
    this.updatedAt = new Date();
  }

  incrementUsage(metricName, amount = 1) {
    if (!metricName) {
      throw new Error('Metric name is required');
    }

    const currentValue = this.usage[metricName] || 0;
    this.usage[metricName] = currentValue + amount;
    this.updatedAt = new Date();
  }

  decrementUsage(metricName, amount = 1) {
    if (!metricName) {
      throw new Error('Metric name is required');
    }

    const currentValue = this.usage[metricName] || 0;
    this.usage[metricName] = Math.max(0, currentValue - amount);
    this.updatedAt = new Date();
  }

  getUsage(metricName) {
    return this.usage[metricName] || 0;
  }

  hasUsage(metricName) {
    return this.usage.hasOwnProperty(metricName) && this.usage[metricName] > 0;
  }

  resetUsage() {
    this.usage = {};
    this.updatedAt = new Date();
  }

  // Common usage metrics
  getJobPostingsUsed() {
    return this.getUsage('jobPostings');
  }

  getApplicationsReceived() {
    return this.getUsage('applications');
  }

  getAiMatchingsUsed() {
    return this.getUsage('aiMatchings');
  }

  hasReachedLimit(metricName, limit) {
    if (limit === -1) {
      return false; // Unlimited
    }

    return this.getUsage(metricName) >= limit;
  }

  // ============================================
  // Payment Management
  // ============================================

  setPaymentMethod(method) {
    if (!method) {
      throw new Error('Payment method is required');
    }

    this.paymentMethod = method;
    this.updatedAt = new Date();
  }

  hasPaymentMethod() {
    return this.paymentMethod !== null;
  }

  removePaymentMethod() {
    this.paymentMethod = null;
    this.autoRenew = false;
    this.updatedAt = new Date();
  }

  // ============================================
  // Business Logic Queries
  // ============================================

  canBeRenewed() {
    return this.isExpiringSoon(30) || this.isExpired();
  }

  canBeCanceled() {
    return this.isActive() || this.isPaused();
  }

  canBePaused() {
    return this.isActive();
  }

  canBeResumed() {
    return this.isPaused() && !this.isExpired();
  }

  requiresPayment() {
    return this.isPending();
  }

  isInGracePeriod(graceDays = 3) {
    if (!this.isExpired()) {
      return false;
    }

    const daysSinceExpiry = Math.floor(
      (new Date() - this.endDate) / (1000 * 60 * 60 * 24)
    );
    return daysSinceExpiry <= graceDays;
  }

  // ============================================
  // Display Information
  // ============================================

  getStatusDisplay() {
    if (this.isExpired()) {
      return 'Expired';
    }

    if (this.isExpiringSoon(7)) {
      return 'Expiring Soon';
    }

    switch (this.status) {
      case SubscriptionStatus.ACTIVE:
        return 'Active';
      case SubscriptionStatus.CANCELED:
        return 'Canceled';
      case SubscriptionStatus.PAUSED:
        return 'Paused';
      case SubscriptionStatus.PENDING:
        return 'Pending Payment';
      default:
        return this.status;
    }
  }

  getSummary() {
    return {
      id: this.id,
      planCode: this.planCode,
      status: this.getStatusDisplay(),
      isActive: this.isActive(),
      daysRemaining: this.getDaysRemaining(),
      autoRenew: this.autoRenew,
      startDate: this.startDate,
      endDate: this.endDate,
      usage: { ...this.usage },
    };
  }

  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      planCode: this.planCode,
      status: this.status,
      statusDisplay: this.getStatusDisplay(),
      isActive: this.isActive(),
      startDate: this.startDate,
      endDate: this.endDate,
      daysRemaining: this.getDaysRemaining(),
      autoRenew: this.autoRenew,
      usage: { ...this.usage },
      paymentMethod: this.paymentMethod,
      canceledAt: this.canceledAt,
      cancelReason: this.cancelReason,
    };
  }
}

// Export class and constants
Subscription.Status = SubscriptionStatus;

module.exports = Subscription;
