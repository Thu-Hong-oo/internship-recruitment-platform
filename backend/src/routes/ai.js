// AI Analysis Routes - Fixed to use correct controllers
const express = require('express');
const router = express.Router();

// Import the CORRECT controllers with actual AI methods
const aiController = require('../controllers/aiController');
const CVBuilderController = require('../controllers/candidate/CVBuilderController');

const { protect } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/globalRateLimit');

// Create controller instances
const cvController = new CVBuilderController();

// Apply authentication and rate limiting to all AI routes
router.use(protect);
router.use(apiRateLimit);

/**
 * @swagger
 * /api/ai/analyze-cv:
 *   post:
 *     summary: Analyze CV content using AI (with file upload)
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: CV file (PDF, DOC, DOCX)
 *     responses:
 *       200:
 *         description: CV analysis results with extracted skills and experience
 *       400:
 *         description: Invalid file or missing CV
 *       429:
 *         description: Too many requests
 */
router.post('/analyze-cv', aiController.analyzeCV);

/**
 * @swagger
 * /api/ai/job-suggestions/{userId}:
 *   get:
 *     summary: Get AI-powered job suggestions for user
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: List of job suggestions with match scores
 */
router.get('/job-suggestions/:userId', async (req, res, next) => {
  // Redirect to job recommendations endpoint
  req.body = { limit: req.query.limit };
  return aiController.getJobRecommendations(req, res, next);
});

/**
 * @swagger
 * /api/ai/skill-roadmap:
 *   post:
 *     summary: Generate personalized learning roadmap
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetRole:
 *                 type: string
 *                 description: Target job role
 *               targetSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Target skills to learn
 *               timeframe:
 *                 type: integer
 *                 default: 12
 *                 description: Learning timeframe in weeks
 *               currentLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 default: beginner
 *     responses:
 *       200:
 *         description: Personalized learning roadmap with milestones
 */
router.post('/skill-roadmap', aiController.generateSkillRoadmap);

/**
 * @swagger
 * /api/ai/job-recommendations:
 *   post:
 *     summary: Get personalized job recommendations
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Number of recommendations to return
 *               minScore:
 *                 type: integer
 *                 default: 60
 *                 description: Minimum match score threshold
 *     responses:
 *       200:
 *         description: List of personalized job recommendations
 */
router.post('/job-recommendations', aiController.getJobRecommendations);

/**
 * @swagger
 * /api/ai/match-score:
 *   post:
 *     summary: Calculate job-candidate match score
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: Job ID to match against
 *               applicantId:
 *                 type: string
 *                 description: Applicant ID (optional, defaults to current user)
 *     responses:
 *       200:
 *         description: Match score analysis with detailed breakdown
 */
router.post('/match-score', aiController.getMatchScore);

/**
 * @swagger
 * /api/ai/analyze-job:
 *   post:
 *     summary: Analyze job posting for optimization
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: Existing job ID to analyze
 *               jobDescription:
 *                 type: string
 *                 description: Job description text to analyze
 *     responses:
 *       200:
 *         description: Job analysis with skill extraction and recommendations
 */
router.post('/analyze-job', aiController.analyzeJobPosting);

/**
 * @swagger
 * /api/ai/insights:
 *   get:
 *     summary: Get AI insights for dashboard
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized AI insights based on user role
 */
router.get('/insights', aiController.getAIInsights);

/**
 * @swagger
 * /api/ai/batch-analyze:
 *   post:
 *     summary: Batch analyze job applications
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: Job ID to analyze applications for
 *     responses:
 *       200:
 *         description: Batch analysis results for all job applications
 */
router.post('/batch-analyze', aiController.batchAnalyzeApplications);

// ============================================
// CV BUILDER AI ROUTES (from CVBuilderController)
// ============================================

/**
 * @swagger
 * /api/ai/cv-suggestions:
 *   post:
 *     summary: Get AI suggestions for CV form fields
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stepType:
 *                 type: string
 *                 enum: [targetJob, careerObjective, skills, experience]
 *                 description: Type of CV section for suggestions
 *               currentData:
 *                 type: object
 *                 description: Current form data
 *               context:
 *                 type: object
 *                 description: Additional context for AI
 *     responses:
 *       200:
 *         description: AI-generated suggestions for CV content
 */
router.post('/cv-suggestions', cvController.getAISuggestions);

/**
 * @swagger
 * /api/ai/job-match-analysis:
 *   post:
 *     summary: Analyze CV-job compatibility
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetJobDescription:
 *                 type: string
 *                 description: Job description to match against
 *               targetJobTitle:
 *                 type: string
 *                 description: Job title
 *     responses:
 *       200:
 *         description: Detailed job match analysis with scores
 */
router.post('/job-match-analysis', cvController.analyzeJobMatch);

/**
 * @swagger
 * /api/ai/skill-gap-analysis:
 *   post:
 *     summary: Analyze skill gaps for target job
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetJobDescription:
 *                 type: string
 *                 description: Job description to analyze against
 *               targetJobTitle:
 *                 type: string
 *                 description: Job title
 *               industry:
 *                 type: string
 *                 description: Industry context
 *     responses:
 *       200:
 *         description: Comprehensive skill gap analysis
 */
router.post('/skill-gap-analysis', cvController.getSkillGapAnalysis);

/**
 * @swagger
 * /api/ai/learning-roadmap:
 *   post:
 *     summary: Generate personalized learning roadmap
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetJobTitle:
 *                 type: string
 *                 description: Target job title
 *               targetJobDescription:
 *                 type: string
 *                 description: Job description
 *               skillGaps:
 *                 type: array
 *                 description: Identified skill gaps
 *               timeframe:
 *                 type: string
 *                 default: "12 weeks"
 *                 description: Learning timeframe
 *               learningPreferences:
 *                 type: object
 *                 description: Learning style preferences
 *     responses:
 *       200:
 *         description: Detailed learning roadmap with weekly plans
 */
router.post('/learning-roadmap', cvController.generateSkillRoadmap);

module.exports = router;
