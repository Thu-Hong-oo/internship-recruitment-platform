// Learning Domain Exports
// Entities
const LearningPath = require('./entities/LearningPath');
const LearningModule = require('./entities/LearningModule');
const LearningProgress = require('./entities/LearningProgress');

// Enums
const LearningPathType = require('./enums/LearningPathType');
const ProgressStatus = require('./enums/ProgressStatus');
const ContentType = require('./enums/ContentType');

// Value Objects
const LearningDuration = require('./value-objects/LearningDuration');

// Repository Interfaces
const ILearningPathRepository = require('./repositories/ILearningPathRepository');
const ILearningModuleRepository = require('./repositories/ILearningModuleRepository');
const ILearningProgressRepository = require('./repositories/ILearningProgressRepository');

module.exports = {
  // Entities
  LearningPath,
  LearningModule,
  LearningProgress,

  // Enums
  LearningPathType,
  ProgressStatus,
  ContentType,

  // Value Objects
  LearningDuration,

  // Repository Interfaces
  ILearningPathRepository,
  ILearningModuleRepository,
  ILearningProgressRepository
};