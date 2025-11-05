/**
 * AI/NLP Routes
 * Presentation Layer - AI/NLP Domain
 * REST API endpoints for AI-powered matching and NLP services
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  matchCandidateToJob,
  getMatchingHistory,
  parseCV,
  parseJobDescription,
  getSkillSuggestions,
  getCareerSuggestions,
  getMarketInsights,
} = require('../controllers/aiController');

// Apply authentication to all routes
router.use(protect);

// @route   POST /api/ai/match
// @desc    Match candidate to job using AI
// @access  Private
router.post('/match', matchCandidateToJob);

// @route   GET /api/ai/matching-history
// @desc    Get AI matching history
// @access  Private
router.get('/matching-history', getMatchingHistory);

// @route   POST /api/ai/parse-cv
// @desc    Parse CV using AI/NLP
// @access  Private
router.post('/parse-cv', parseCV);

// @route   POST /api/ai/parse-job-description
// @desc    Parse job description using AI/NLP
// @access  Private
router.post('/parse-job-description', parseJobDescription);

// @route   POST /api/ai/suggestions/skills
// @desc    Get skill suggestions based on profile
// @access  Private
router.post('/suggestions/skills', getSkillSuggestions);

// @route   POST /api/ai/suggestions/career
// @desc    Get career path suggestions
// @access  Private
router.post('/suggestions/career', getCareerSuggestions);

// @route   GET /api/ai/insights/market
// @desc    Get market insights and trends
// @access  Private
router.get('/insights/market', getMarketInsights);

module.exports = router;
