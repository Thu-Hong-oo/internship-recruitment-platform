// AI Analysis Routes - Refactored with clear separation
const express = require('express');
const router = express.Router();

// Import AI Controller (handles ALL AI features)
const aiController = require('../controllers/aiController');

const { protect } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/globalRateLimit');

// Apply authentication and rate limiting to all AI routes
router.use(protect);
router.use(apiRateLimit);

// ============================================
// CV ANALYSIS ROUTES
// ============================================

/**
 * @swagger
 * /api/ai/analyze-cv:
 *   post:
 *     summary: Analyze CV content using AI (with file upload)
 *     tags: [AI - CV Analysis]
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
 * /api/ai/analyze-cv-text:
 *   post:
 *     summary: Analyze CV from raw text (no file upload needed)
 *     tags: [AI - CV Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rawCVText
 *             properties:
 *               rawCVText:
 *                 type: string
 *                 description: Raw CV text content
 *     responses:
 *       200:
 *         description: CV analysis with extracted data
 *       400:
 *         description: Missing or invalid raw text
 */
router.post('/analyze-cv-text', aiController.analyzeCVText);

// ============================================
// JOB & CAREER AI ROUTES
// ============================================

/**
 * @swagger
 * /api/ai/job-recommendations:
 *   post:
 *     summary: Get personalized job recommendations
 *     tags: [AI - Jobs]
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
 * /api/ai/job-suggestions/{userId}:
 *   get:
 *     summary: Get AI-powered job suggestions for user (alias for job-recommendations)
 *     tags: [AI - Jobs]
 *     deprecated: true
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
  req.body = { limit: req.query.limit || 10 };
  return aiController.getJobRecommendations(req, res, next);
});

/**
 * @swagger
 * /api/ai/analyze-job-posting:
 *   post:
 *     summary: Analyze job posting for optimization (Employer feature)
 *     tags: [AI - Jobs]
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
 *       403:
 *         description: Not authorized to analyze this job
 */
router.post('/analyze-job-posting', aiController.analyzeJobPosting);

/**
 * @swagger
 * /api/ai/analyze-job:
 *   post:
 *     summary: Analyze job posting (alias for analyze-job-posting)
 *     tags: [AI - Jobs]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 */
router.post('/analyze-job', aiController.analyzeJobPosting);

/**
 * @swagger
 * /api/ai/analyze-job-description:
 *   post:
 *     summary: Analyze job description in detail for CV optimization
 *     tags: [AI - Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobDescription
 *             properties:
 *               jobDescription:
 *                 type: string
 *                 description: Full job description text
 *               targetJob:
 *                 type: string
 *                 description: Target job title
 *               companyInfo:
 *                 type: object
 *                 description: Company information context
 *     responses:
 *       200:
 *         description: Detailed job analysis with CV optimization tips
 */
router.post('/analyze-job-description', aiController.analyzeJobDescription);

// ============================================
// MATCHING & SCORING ROUTES
// ============================================

/**
 * @swagger
 * /api/ai/analyze-job-match:
 *   post:
 *     summary: Analyze compatibility between candidate CV and job
 *     tags: [AI - Matching]
 *     deprecated: true
 *     description: |
 *       ⚠️ **DEPRECATED**: This endpoint is deprecated. 
 *       Please use `/api/nlp/matching-score` instead for advanced matching with detailed breakdown, caching, and recalculation.
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
 *               jobId:
 *                 type: string
 *                 description: Job ID (optional, will fetch from DB)
 *     responses:
 *       200:
 *         description: Detailed job match analysis with compatibility scores
 *       410:
 *         description: This endpoint is deprecated. Use /api/nlp/matching-score instead.
 */
router.post('/analyze-job-match', aiController.analyzeJobMatch);

/**
 * @swagger
 * /api/ai/job-match-analysis:
 *   post:
 *     summary: Analyze CV-job compatibility (alias)
 *     tags: [AI - Matching]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 */
router.post('/job-match-analysis', aiController.analyzeJobMatch);

/**
 * @swagger
 * /api/ai/match-score:
 *   post:
 *     summary: Calculate job-candidate match score
 *     tags: [AI - Matching]
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
 * /api/ai/analyze-candidate:
 *   post:
 *     summary: Analyze candidate for a specific job (Employer view)
 *     tags: [AI - Matching]
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
 *                 description: Applicant ID to analyze
 *     responses:
 *       200:
 *         description: Candidate analysis with match score
 */
router.post('/analyze-candidate', aiController.analyzeCandidate);

// ============================================
// SKILLS & LEARNING ROUTES
// ============================================

/**
 * @swagger
 * /api/ai/skill-gap-analysis:
 *   post:
 *     summary: Analyze skill gaps between current profile and target job
 *     tags: [AI - Skills]
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
 *               jobId:
 *                 type: string
 *                 description: Job ID (optional)
 *     responses:
 *       200:
 *         description: Comprehensive skill gap analysis with recommendations
 */
router.post('/skill-gap-analysis', aiController.getSkillGapAnalysis);

/**
 * @swagger
 * /api/ai/skill-roadmap:
 *   post:
 *     summary: Generate personalized skill learning roadmap
 *     tags: [AI - Skills]
 *     deprecated: true
 *     description: |
 *       ⚠️ **DEPRECATED**: This endpoint is deprecated. 
 *       Please use `/api/nlp/learning-roadmap` instead for full CRUD operations, progress tracking, feedback, and resource recommendations.
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
 *               targetJobTitle:
 *                 type: string
 *                 description: Target job title (alternative)
 *               targetJobDescription:
 *                 type: string
 *                 description: Target job description (alternative)
 *               skillGaps:
 *                 type: array
 *                 description: Identified skill gaps
 *               timeframe:
 *                 type: integer
 *                 default: 12
 *                 description: Learning timeframe in weeks
 *               currentLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 default: beginner
 *               learningPreferences:
 *                 type: object
 *                 description: Learning style preferences
 *     responses:
 *       200:
 *         description: Personalized learning roadmap with milestones and resources
 *       410:
 *         description: This endpoint is deprecated. Use /api/nlp/learning-roadmap instead.
 */
router.post('/skill-roadmap', aiController.generateSkillRoadmap);

/**
 * @swagger
 * /api/ai/learning-roadmap:
 *   post:
 *     summary: Generate personalized learning roadmap (alias)
 *     tags: [AI - Skills]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 */
router.post('/learning-roadmap', aiController.generateSkillRoadmap);

/**
 * @swagger
 * /api/ai/suggestions:
 *   post:
 *     summary: Get AI suggestions for form fields (career objective, skills, etc.)
 *     tags: [AI - Suggestions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stepType
 *             properties:
 *               stepType:
 *                 type: string
 *                 enum: [targetJob, careerObjective, skills, experience]
 *                 description: Type of form field needing suggestions
 *               currentData:
 *                 type: object
 *                 description: Current form data
 *               context:
 *                 type: object
 *                 description: Additional context for AI
 *     responses:
 *       200:
 *         description: AI-generated suggestions for the specified field
 */
router.post('/suggestions', aiController.getAISuggestions);

/**
 * @swagger
 * /api/ai/cv-suggestions:
 *   post:
 *     summary: Get AI suggestions for CV form fields (alias)
 *     tags: [AI - Suggestions]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 */
router.post('/cv-suggestions', aiController.getAISuggestions);

// ============================================
// INSIGHTS & ANALYTICS ROUTES
// ============================================

/**
 * @swagger
 * /api/ai/insights:
 *   get:
 *     summary: Get AI insights for dashboard (auto-detects user role)
 *     tags: [AI - Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized AI insights based on user role (candidate/employer/admin)
 */
router.get('/insights', aiController.getAIInsights);

/**
 * @swagger
 * /api/ai/candidate-insights:
 *   get:
 *     summary: Get AI insights specifically for candidates
 *     tags: [AI - Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate-specific insights (profile strength, skill gaps, etc.)
 */
router.get('/candidate-insights', aiController.getCandidateInsights);

/**
 * @swagger
 * /api/ai/employer-insights:
 *   get:
 *     summary: Get AI insights specifically for employers
 *     tags: [AI - Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employer-specific insights (job performance, applicant analytics, etc.)
 */
router.get('/employer-insights', aiController.getEmployerInsights);

// ============================================
// BATCH OPERATIONS ROUTES (Employer Only)
// ============================================

/**
 * @swagger
 * /api/ai/batch-analyze-applications:
 *   post:
 *     summary: Batch analyze all applications for a job
 *     tags: [AI - Batch Operations]
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
 *         description: Batch analysis results for all job applications
 *       403:
 *         description: Not authorized to analyze applications for this job
 */
router.post(
  '/batch-analyze-applications',
  aiController.batchAnalyzeApplications
);

/**
 * @swagger
 * /api/ai/batch-analyze:
 *   post:
 *     summary: Batch analyze job applications (alias)
 *     tags: [AI - Batch Operations]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 */
router.post('/batch-analyze', aiController.batchAnalyzeApplications);

module.exports = router;
