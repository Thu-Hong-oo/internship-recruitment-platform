// Skill-Development Domain Exports
// Entities
const SkillRoadmap = require('./entities/SkillRoadmap');
const SkillGapAnalysis = require('./entities/SkillGapAnalysis');

// Domain Services
const SkillDevelopmentService = require('./services/SkillDevelopmentService');

// Repository Interfaces
const ISkillRoadmapRepository = require('./repositories/ISkillRoadmapRepository');
const ISkillGapAnalysisRepository = require('./repositories/ISkillGapAnalysisRepository');

module.exports = {
  // Entities
  SkillRoadmap,
  SkillGapAnalysis,

  // Domain Services
  SkillDevelopmentService,

  // Repository Interfaces
  ISkillRoadmapRepository,
  ISkillGapAnalysisRepository,
};
