/**
 * Resource Recommendation Constants
 * Centralized configuration for resource recommendation service
 */

module.exports = {
  // Level progression
  LEVEL_ORDER: ['none', 'beginner', 'intermediate', 'advanced', 'expert'],
  
  // Phase characteristics
  PHASE_CHARACTERISTICS: {
    1: {
      focus: 'fundamentals',
      preferredTypes: ['documentation', 'video', 'course'],
      difficultyRange: ['beginner', 'intermediate'],
      maxDuration: '20 hours',
      priority: 'understanding',
    },
    2: {
      focus: 'practice',
      preferredTypes: ['course', 'video', 'project'],
      difficultyRange: ['intermediate', 'advanced'],
      maxDuration: '40 hours',
      priority: 'application',
    },
    3: {
      focus: 'mastery',
      preferredTypes: ['course', 'article', 'project'],
      difficultyRange: ['advanced', 'expert'],
      maxDuration: '60 hours',
      priority: 'creation',
    },
    4: {
      focus: 'specialization',
      preferredTypes: ['course', 'article', 'documentation'],
      difficultyRange: ['advanced', 'expert'],
      maxDuration: '80 hours',
      priority: 'expertise',
    },
  },

  // Credibility weights
  CREDIBILITY_WEIGHTS: {
    providerReputation: 0.40,
    userRating: 0.30,
    resourceType: 0.20,
    certificateOffered: 0.10,
  },

  // Resource thresholds
  THRESHOLDS: {
    MIN_RESOURCES_FOR_INTELLIGENT: 5,
    MIN_RESOURCES_FOR_API_FALLBACK: 3,
    MIN_CREDIBILITY_SCORE: 0.6,
    DEFAULT_RESOURCE_LIMIT: 5,
    MMR_LAMBDA: 0.7, // 70% relevance, 30% diversity
    MIN_RATING_FOR_RAG: 4.0,
  },

  // Cache TTL
  CACHE: {
    API_CACHE_TTL_SECONDS: 60 * 60 * 6, // 6 hours
  },

  // Default values
  DEFAULTS: {
    CURRENT_LEVEL: 'none',
    TARGET_LEVEL: 'intermediate',
    PHASE_NUMBER: 1,
    WEEK_NUMBER: 1,
    TOTAL_WEEKS: 12,
    BUDGET: 'free',
    LEARNING_STYLE: 'visual',
    PREFERRED_LANGUAGE: 'en',
  },

  // Resource type inference patterns
  TYPE_INFERENCE: {
    VIDEO: ['youtube.com', 'vimeo.com'],
    COURSE: ['udemy.com', 'coursera.org', 'edx.org'],
    PROJECT: ['github.com', 'gitlab.com'],
    DOCUMENTATION: ['docs.', 'documentation', '/docs/'],
    DEFAULT: 'article',
  },

  // Phase titles
  PHASE_TITLES: {
    1: 'Foundation',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Specialization',
  },
};

