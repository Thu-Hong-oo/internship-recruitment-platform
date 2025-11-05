/**
 * AI/NLP Domain - Index
 * Exports all AI/NLP domain entities, value objects, services, and enums
 */

// Services
const NLPEngine = require('./services/NLPEngine');
const CVParser = require('./services/CVParser');
const JobDescriptionParser = require('./services/JobDescriptionParser');
const AIMatchingService = require('./services/AIMatchingService');
const SuggestionService = require('./services/SuggestionService');

// Repositories
const IMatchingHistoryRepository = require('./repositories/IMatchingHistoryRepository');

module.exports = {
  // Services
  NLPEngine,
  CVParser,
  JobDescriptionParser,
  AIMatchingService,
  SuggestionService,
  // Repositories
  IMatchingHistoryRepository,
};
