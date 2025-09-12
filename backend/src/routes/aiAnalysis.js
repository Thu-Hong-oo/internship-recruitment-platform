const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  analyzeCV,
  analyzeJobDescription,
  getMatchingScore,
  getSkillGaps,
  getRecommendations,
  generateSkillRoadmap,
  analyzeProficiency,
  getBenchmarkAnalysis,
  getMarketInsights
} = require('../controllers/aiAnalysisController');

// CV Analysis
router.post('/cv', protect, analyzeCV);
router.post('/job-description', protect, authorize('employer'), analyzeJobDescription);
router.post('/match-score', protect, getMatchingScore);

// Skills Analysis
router.get('/skill-gaps', protect, authorize('intern'), getSkillGaps);
router.get('/recommendations', protect, getRecommendations);
router.post('/roadmap/generate', protect, authorize('intern'), generateSkillRoadmap);
router.post('/skills/proficiency', protect, analyzeProficiency);

// Market Analysis
router.get('/benchmark', protect, getBenchmarkAnalysis);
router.get('/market-insights', protect, getMarketInsights);

module.exports = router;