/**
 * MatchType Enum
 * Domain: AI-Matching
 * Represents different types of matches between candidates and jobs
 */
const MatchType = Object.freeze({
  SKILL_BASED: 'SKILL_BASED',
  EXPERIENCE_BASED: 'EXPERIENCE_BASED',
  EDUCATION_BASED: 'EDUCATION_BASED',
  LOCATION_BASED: 'LOCATION_BASED',
  SALARY_BASED: 'SALARY_BASED',
  COMPREHENSIVE: 'COMPREHENSIVE',
  CUSTOM: 'CUSTOM'
});

module.exports = MatchType;