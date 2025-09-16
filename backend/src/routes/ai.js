const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadRateLimit } = require('../middleware/globalRateLimit');
const {
  analyzeCV,
  getJobRecommendations,
  generateSkillRoadmap,
  analyzeJobPosting,
  getMatchScore,
  getAIInsights,
  batchAnalyzeApplications
} = require('../controllers/aiController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/ai/analyze-cv:
 *   post:
 *     summary: Analyze CV/Resume using AI
 *     tags: [AI Services]
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
 *         description: CV analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analysis:
 *                       type: object
 *                       description: AI analysis results
 *                     extractedText:
 *                       type: string
 *                       description: Preview of extracted text
 *                     filename:
 *                       type: string
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 */
router.post('/analyze-cv', uploadRateLimit, analyzeCV);

/**
 * @swagger
 * /api/ai/job-recommendations:
 *   post:
 *     summary: Get AI-powered job recommendations
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
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
 *         description: Job recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalJobs:
 *                       type: integer
 *                     filteredCount:
 *                       type: integer
 */
router.post('/job-recommendations', getJobRecommendations);

/**
 * @swagger
 * /api/ai/skill-roadmap:
 *   post:
 *     summary: Generate personalized skill development roadmap
 *     tags: [AI Services]
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
 *                 description: Skills to develop
 *               timeframe:
 *                 type: integer
 *                 default: 12
 *                 description: Development timeframe in weeks
 *               currentLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 default: beginner
 *     responses:
 *       200:
 *         description: Skill roadmap generated successfully
 */
router.post('/skill-roadmap', generateSkillRoadmap);

/**
 * @swagger
 * /api/ai/analyze-job:
 *   post:
 *     summary: Analyze job posting with AI
 *     tags: [AI Services]
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
 *                 description: ID of existing job to analyze
 *               jobDescription:
 *                 type: string
 *                 description: Job description text to analyze
 *     responses:
 *       200:
 *         description: Job analyzed successfully
 */
router.post('/analyze-job', authorize('employer', 'admin'), analyzeJobPosting);

/**
 * @swagger
 * /api/ai/match-score:
 *   post:
 *     summary: Calculate match score between applicant and job
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: Job ID
 *               applicantId:
 *                 type: string
 *                 description: Applicant ID (optional, uses current user if not provided)
 *     responses:
 *       200:
 *         description: Match score calculated successfully
 */
router.post('/match-score', getMatchScore);

/**
 * @swagger
 * /api/ai/insights:
 *   get:
 *     summary: Get AI-powered insights for dashboard
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI insights generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Role-specific insights and analytics
 */
router.get('/insights', getAIInsights);

/**
 * @swagger
 * /api/ai/batch-analyze:
 *   post:
 *     summary: Batch analyze applications for a job
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: Job ID to analyze applications for
 *     responses:
 *       200:
 *         description: Batch analysis completed successfully
 */
router.post('/batch-analyze', authorize('employer', 'admin'), batchAnalyzeApplications);

module.exports = router;
