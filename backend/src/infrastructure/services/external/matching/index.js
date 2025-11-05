/**
 * Matching Services - Export all job and skill matching services
 * These services handle AI-powered matching, skill analysis, and experience enhancement
 */

module.exports = {
  // Job Matching
  JobMatcherService: require('./JobMatcherService'),

  // Skill Analysis
  SkillAnalysisService: require('./SkillAnalysisService'),

  // Experience Enhancement
  ExperienceEnhancerService: require('./ExperienceEnhancerService'),
};
