/**
 * Personalization Service
 * 
 * Personalize resources based on user preferences:
 * - Learning style (visual, reading, hands-on)
 * - Budget constraints
 * - Time availability
 * - Prerequisites
 */

const { logger } = require('../../utils/logger');

class PersonalizationService {
  constructor() {
    // Learning style preferences
    this.learningStyleWeights = {
      visual: {
        video: 1.0,
        course: 0.8,
        documentation: 0.5,
        article: 0.4,
        project: 0.7,
      },
      reading: {
        documentation: 1.0,
        article: 0.9,
        course: 0.7,
        video: 0.4,
        project: 0.6,
      },
      handsOn: {
        course: 1.0,
        project: 1.0,
        video: 0.7,
        documentation: 0.6,
        article: 0.5,
      },
    };
  }

  /**
   * Filter resources by budget
   * 
   * @param {Array} resources - Array of resources
   * @param {string} budget - Budget constraint ('free', '< 50', '< 100', 'any')
   * @returns {Array} Filtered resources
   */
  filterByBudget(resources, budget = 'free') {
    // Convert budget to string if it's a number
    if (typeof budget === 'number') {
      budget = `< ${budget}`;
    }
    
    if (budget === 'any') {
      return resources;
    }

    if (budget === 'free') {
      return resources.filter(r => r.isFree === true);
    }

    // Parse budget limit
    const budgetMatch = budget.match(/< (\d+)/);
    if (budgetMatch) {
      const maxCost = parseInt(budgetMatch[1]);
      return resources.filter(r => 
        r.isFree === true || (r.estimatedCost && r.estimatedCost < maxCost)
      );
    }

    // Default to free if budget format not recognized
    logger.warn(`Unknown budget format: ${budget}, defaulting to free`);
    return resources.filter(r => r.isFree === true);
  }

  /**
   * Filter resources by maximum time available
   * 
   * @param {Array} resources - Array of resources
   * @param {number} maxHours - Maximum hours available
   * @returns {Array} Filtered resources
   */
  filterByTime(resources, maxHours) {
    if (!maxHours || maxHours <= 0) {
      return resources; // No time constraint
    }

    return resources.filter(r => {
      const duration = this.parseDuration(r.duration);
      return duration <= maxHours;
    });
  }

  /**
   * Score and rank resources by learning style
   * 
   * @param {Array} resources - Array of resources
   * @param {string} learningStyle - Learning style ('visual', 'reading', 'handsOn')
   * @returns {Array} Resources with styleScore, sorted by styleScore
   */
  scoreByLearningStyle(resources, learningStyle = 'visual') {
    const weights = this.learningStyleWeights[learningStyle] || this.learningStyleWeights.visual;

    return resources
      .map(r => ({
        ...r,
        styleScore: weights[r.type] || 0.5,
      }))
      .sort((a, b) => b.styleScore - a.styleScore);
  }

  /**
   * Personalize resources based on all user preferences
   * 
   * @param {Array} resources - Array of resources
   * @param {Object} preferences - User preferences
   * @param {string} preferences.budget - Budget constraint
   * @param {number} preferences.maxHours - Maximum hours
   * @param {string} preferences.learningStyle - Learning style
   * @returns {Array} Personalized and ranked resources
   */
  personalize(resources, preferences = {}) {
    let personalized = [...resources];

    // Apply filters
    if (preferences.budget) {
      personalized = this.filterByBudget(personalized, preferences.budget);
    }

    if (preferences.maxHours) {
      personalized = this.filterByTime(personalized, preferences.maxHours);
    }

    // Score by learning style
    if (preferences.learningStyle) {
      personalized = this.scoreByLearningStyle(personalized, preferences.learningStyle);
    }

    return personalized;
  }

  /**
   * Parse duration string to hours
   * 
   * @param {string} duration - Duration string (e.g., "40 hours", "3 months")
   * @returns {number} Duration in hours
   */
  parseDuration(duration) {
    if (!duration || typeof duration !== 'string') {
      return 0;
    }

    // Try to match patterns like "40 hours", "3 months", "2 weeks"
    const match = duration.match(/(\d+)\s*(hour|hours|month|months|week|weeks|day|days|minute|minutes)/i);
    if (!match) {
      // Try to extract just numbers (assume hours)
      const numberMatch = duration.match(/(\d+)/);
      if (numberMatch) {
        return parseInt(numberMatch[1]);
      }
      return 0;
    }

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.includes('hour')) return value;
    if (unit.includes('minute')) return value / 60; // Convert minutes to hours
    if (unit.includes('day')) return value * 8; // 8 hours/day
    if (unit.includes('week')) return value * 40; // 40 hours/week
    if (unit.includes('month')) return value * 30 * 8; // 8 hours/day, 30 days/month

    return 0;
  }

  /**
   * Check if resource matches user's current level
   * 
   * @param {Object} resource - Resource object
   * @param {string} currentLevel - User's current level
   * @param {string} targetLevel - User's target level
   * @returns {boolean} True if resource matches level
   */
  matchesLevel(resource, currentLevel, targetLevel) {
    const resourceDifficulty = resource.difficulty || 'beginner';
    const levelOrder = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];

    const currentIndex = levelOrder.indexOf(currentLevel) || 0;
    const targetIndex = levelOrder.indexOf(targetLevel) || 2;
    const resourceIndex = levelOrder.indexOf(resourceDifficulty) || 1;

    // Resource should be between current and target level
    return resourceIndex >= currentIndex && resourceIndex <= targetIndex;
  }

  /**
   * Filter resources by level match
   * 
   * @param {Array} resources - Array of resources
   * @param {string} currentLevel - User's current level
   * @param {string} targetLevel - User's target level
   * @returns {Array} Filtered resources
   */
  filterByLevel(resources, currentLevel, targetLevel) {
    return resources.filter(r => 
      this.matchesLevel(r, currentLevel, targetLevel)
    );
  }
}

module.exports = new PersonalizationService();

