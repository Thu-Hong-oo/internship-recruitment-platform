/**
 * Plan Domain Entity
 * Represents a subscription plan with features and pricing
 *
 * Business Rules:
 * - Plan code must be unique
 * - Price must be non-negative
 * - Features define what the plan includes
 * - Only active plans can be subscribed to
 * - Plans are immutable once created (create new version instead)
 */

class Plan {
  constructor(
    id,
    code,
    name,
    price,
    currency,
    features,
    isActive = true,
    sortOrder = 0,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.price = price;
    this.currency = currency;
    this.features = features || {};
    this.isActive = isActive;
    this.sortOrder = sortOrder;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    if (!this.id) {
      throw new Error('Plan ID is required');
    }

    if (!this.code) {
      throw new Error('Plan code is required');
    }

    if (!this.name) {
      throw new Error('Plan name is required');
    }

    if (typeof this.price !== 'number' || this.price < 0) {
      throw new Error('Price must be a non-negative number');
    }

    if (!this.currency) {
      throw new Error('Currency is required');
    }

    if (typeof this.features !== 'object' || this.features === null) {
      throw new Error('Features must be an object');
    }

    if (typeof this.isActive !== 'boolean') {
      throw new Error('IsActive must be a boolean');
    }

    if (typeof this.sortOrder !== 'number') {
      throw new Error('Sort order must be a number');
    }
  }

  // ============================================
  // Feature Management
  // ============================================

  hasFeature(featureName) {
    return this.features.hasOwnProperty(featureName);
  }

  getFeature(featureName) {
    return this.features[featureName] || null;
  }

  getFeatureValue(featureName, defaultValue = null) {
    return this.features[featureName] !== undefined
      ? this.features[featureName]
      : defaultValue;
  }

  getAllFeatures() {
    return { ...this.features };
  }

  getFeatureCount() {
    return Object.keys(this.features).length;
  }

  // Common feature checks
  getMaxJobPostings() {
    return this.getFeatureValue('maxJobPostings', 0);
  }

  getMaxApplications() {
    return this.getFeatureValue('maxApplications', 0);
  }

  hasAiMatching() {
    return this.getFeatureValue('aiMatching', false);
  }

  hasAdvancedAnalytics() {
    return this.getFeatureValue('advancedAnalytics', false);
  }

  hasPrioritySupport() {
    return this.getFeatureValue('prioritySupport', false);
  }

  hasCustomBranding() {
    return this.getFeatureValue('customBranding', false);
  }

  getMaxTeamMembers() {
    return this.getFeatureValue('maxTeamMembers', 1);
  }

  // ============================================
  // Status Management
  // ============================================

  activate() {
    if (this.isActive) {
      return; // Already active
    }

    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate() {
    if (!this.isActive) {
      return; // Already inactive
    }

    this.isActive = false;
    this.updatedAt = new Date();
  }

  // ============================================
  // Pricing
  // ============================================

  getFormattedPrice() {
    return `${this.price.toLocaleString()} ${this.currency}`;
  }

  getPricePerMonth() {
    return this.price;
  }

  getPricePerYear() {
    return this.price * 12;
  }

  getAnnualSavings(monthlyPrice) {
    const annualFromMonthly = monthlyPrice * 12;
    const annualPrice = this.getPricePerYear();
    return Math.max(0, annualFromMonthly - annualPrice);
  }

  isFree() {
    return this.price === 0;
  }

  isPaid() {
    return this.price > 0;
  }

  // ============================================
  // Comparison
  // ============================================

  isMoreExpensiveThan(otherPlan) {
    return this.price > otherPlan.price;
  }

  isCheaperThan(otherPlan) {
    return this.price < otherPlan.price;
  }

  compareFeatures(otherPlan) {
    const thisFeatures = Object.keys(this.features);
    const otherFeatures = Object.keys(otherPlan.features);

    return {
      unique: thisFeatures.filter(f => !otherFeatures.includes(f)),
      missing: otherFeatures.filter(f => !thisFeatures.includes(f)),
      common: thisFeatures.filter(f => otherFeatures.includes(f)),
    };
  }

  hasMoreFeaturesThan(otherPlan) {
    return this.getFeatureCount() > otherPlan.getFeatureCount();
  }

  // ============================================
  // Display Information
  // ============================================

  getSummary() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      price: this.getFormattedPrice(),
      isActive: this.isActive,
      featureCount: this.getFeatureCount(),
      isFree: this.isFree(),
      sortOrder: this.sortOrder,
    };
  }

  getDescription() {
    const features = [];

    if (this.getMaxJobPostings()) {
      features.push(`Up to ${this.getMaxJobPostings()} job postings`);
    }

    if (this.hasAiMatching()) {
      features.push('AI-powered candidate matching');
    }

    if (this.hasAdvancedAnalytics()) {
      features.push('Advanced analytics dashboard');
    }

    if (this.hasPrioritySupport()) {
      features.push('Priority support');
    }

    if (this.getMaxTeamMembers() > 1) {
      features.push(`Up to ${this.getMaxTeamMembers()} team members`);
    }

    return features.join(', ');
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      price: this.price,
      currency: this.currency,
      features: this.getAllFeatures(),
      isActive: this.isActive,
      sortOrder: this.sortOrder,
      formattedPrice: this.getFormattedPrice(),
      description: this.getDescription(),
    };
  }
}

module.exports = Plan;
