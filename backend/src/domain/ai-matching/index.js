// AI-Matching Domain Exports
// Entities
const JobCandidateMatch = require('./entities/JobCandidateMatch');
const MatchingCriteria = require('./entities/MatchingCriteria');

// Enums
const MatchingAlgorithm = require('./enums/MatchingAlgorithm');
const MatchStatus = require('./enums/MatchStatus');
const MatchType = require('./enums/MatchType');

// Value Objects
const SimilarityScore = require('./value-objects/SimilarityScore');

// Repository Interfaces
const IJobCandidateMatchRepository = require('./repositories/IJobCandidateMatchRepository');
const IMatchingCriteriaRepository = require('./repositories/IMatchingCriteriaRepository');

module.exports = {
  // Entities
  JobCandidateMatch,
  MatchingCriteria,

  // Enums
  MatchingAlgorithm,
  MatchStatus,
  MatchType,

  // Value Objects
  SimilarityScore,

  // Repository Interfaces
  IJobCandidateMatchRepository,
  IMatchingCriteriaRepository
};