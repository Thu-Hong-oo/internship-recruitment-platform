const express = require('express');
const router = express.Router();
const advancedNLPController = require('../controllers/advancedNLPController');
const { protect, authorize } = require('../middleware/auth');

// ============================================================
// 📊 MATCHING SCORE ROUTES
// ============================================================

/**
 * @route   POST /api/nlp/matching-score
 * @desc    Calculate advanced matching score between CV and Job
 * @access  Private (Candidate + Employer)
 */
router.post(
  '/matching-score',
  protect,
  advancedNLPController.calculateMatchingScore
);

/**
 * @route   GET /api/nlp/matching-score/:jobId/:candidateId
 * @desc    Get existing matching score
 * @access  Private
 */
router.get(
  '/matching-score/:jobId/:candidateId',
  protect,
  advancedNLPController.getMatchingScore
);

/**
 * @route   GET /api/nlp/top-candidates/:jobId
 * @desc    Get top candidates for a job (For Employers)
 * @access  Private (Employer only)
 */
router.get(
  '/top-candidates/:jobId',
  protect,
  authorize('employer'),
  advancedNLPController.getTopCandidates
);

/**
 * @route   GET /api/nlp/best-matches
 * @desc    Get best job matches for candidate
 * @access  Private (Candidate/Intern)
 */
router.get(
  '/best-matches',
  protect,
  authorize('intern', 'candidate'),
  advancedNLPController.getBestJobMatches
);

/**
 * @route   POST /api/nlp/recalculate-scores/:jobId
 * @desc    Recalculate matching scores for all applicants (Employer only)
 * @access  Private (Employer)
 */
router.post(
  '/recalculate-scores/:jobId',
  protect,
  authorize('employer'),
  advancedNLPController.recalculateJobScores
);

// ============================================================
// 🎓 LEARNING ROADMAP ROUTES
// ============================================================

/**
 * @route   POST /api/nlp/learning-roadmap
 * @desc    Generate personalized learning roadmap
 * @access  Private (Candidate/Intern)
 */
router.post(
  '/learning-roadmap',
  protect,
  authorize('intern', 'candidate'),
  advancedNLPController.generateLearningRoadmap
);

/**
 * @route   GET /api/nlp/learning-roadmap/:roadmapId
 * @desc    Get learning roadmap by ID
 * @access  Private
 */
router.get(
  '/learning-roadmap/:roadmapId',
  protect,
  advancedNLPController.getLearningRoadmap
);

/**
 * @route   GET /api/nlp/my-roadmaps
 * @desc    Get all roadmaps for current user
 * @access  Private (Candidate/Intern)
 */
router.get(
  '/my-roadmaps',
  protect,
  authorize('intern', 'candidate'),
  advancedNLPController.getMyRoadmaps
);

/**
 * @route   PUT /api/nlp/learning-roadmap/:roadmapId/progress
 * @desc    Update roadmap progress
 * @access  Private (Candidate/Intern)
 */
router.put(
  '/learning-roadmap/:roadmapId/progress',
  protect,
  authorize('intern', 'candidate'),
  advancedNLPController.updateRoadmapProgress
);

/**
 * @route   PUT /api/nlp/learning-roadmap/:roadmapId/feedback
 * @desc    Submit feedback for roadmap
 * @access  Private (Candidate/Intern)
 */
router.put(
  '/learning-roadmap/:roadmapId/feedback',
  protect,
  authorize('intern', 'candidate'),
  advancedNLPController.submitRoadmapFeedback
);

/**
 * @route   GET /api/nlp/roadmap/recommended-resources/:roadmapId
 * @desc    Get recommended resources for current week
 * @access  Private
 */
router.get(
  '/roadmap/recommended-resources/:roadmapId',
  protect,
  advancedNLPController.getRecommendedResources
);

/**
 * @route   GET /api/nlp/popular-roadmaps
 * @desc    Get popular public roadmaps
 * @access  Public
 */
router.get('/popular-roadmaps', advancedNLPController.getPopularRoadmaps);

// ============================================================
// 🤖 RAG-POWERED ROUTES (Credible, Verifiable Resources)
// ============================================================

/**
 * @route   POST /api/nlp/learning-roadmap-rag
 * @desc    Generate RAG-powered learning roadmap with real resources
 * @access  Private (Candidate/Intern)
 */
router.post(
  '/learning-roadmap-rag',
  protect,
  authorize('intern', 'candidate'),
  advancedNLPController.generateRagRoadmap
);

/**
 * @route   GET /api/nlp/rag-health
 * @desc    Check RAG service health and statistics
 * @access  Private
 */
router.get(
  '/rag-health',
  protect,
  advancedNLPController.checkRagHealth
);

module.exports = router;
