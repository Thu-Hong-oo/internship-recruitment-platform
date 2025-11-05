// src/domain/profile/index.js
const Candidate = require('./Candidate');
const CV = require('./CV');
const JobSeekingStatus = require('./JobSeekingStatus');
const Education = require('./value-objects/Education');

// Repositories
const ICandidateRepository = require('./repositories/ICandidateRepository');

module.exports = {
  Candidate,
  CV,
  JobSeekingStatus,
  Education,
  // Repositories
  ICandidateRepository,
};
