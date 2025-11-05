/**
 * AI/NLP Routes
 * Presentation Layer - AI/NLP Domain
 * REST API endpoints for AI-powered matching and NLP services
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { CqrsConfig } = require('../../application/ai-nlp');
const AIMatchingService = require('../../domain/ai-nlp/services/AIMatchingService');
const NLPEngine = require('../../domain/ai-nlp/services/NLPEngine');
const CVParser = require('../../domain/ai-nlp/services/CVParser');
const JobDescriptionParser = require('../../domain/ai-nlp/services/JobDescriptionParser');
const CandidateRepository = require('../../infrastructure/repositories/CandidateRepository');
const JobRepository = require('../../infrastructure/repositories/JobRepository');
const AiMatchingRepository = require('../../infrastructure/repositories/AiMatchingRepository');
const SkillRepository = require('../../infrastructure/repositories/SkillRepository');

// Initialize dependencies
const nlpEngine = new NLPEngine({
  useAdvancedEngine: process.env.USE_ADVANCED_NLP === 'true' || false, // Enable research mode
});
const cvParser = new CVParser();
const jobDescriptionParser = new JobDescriptionParser();
const skillRepository = new SkillRepository();
const candidateRepository = new CandidateRepository();
const jobRepository = new JobRepository();
const aiMatchingRepository = new AiMatchingRepository();

const aiMatchingService = new AIMatchingService({
  nlpEngine,
  cvParser,
  jobDescriptionParser,
  skillRepository,
  matchingHistoryRepository: aiMatchingRepository,
});

// Initialize CQRS for AI/NLP domain
const cqrsConfig = new CqrsConfig({
  aiMatchingService,
  candidateRepository,
  jobRepository,
  aiMatchingRepository,
});

// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * /api/ai/match:
 *   post:
 *     tags: [AI/NLP]
 *     summary: Match candidate to job using AI
 *     description: Perform AI-powered matching between a candidate and job posting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *               - jobId
 *             properties:
 *               candidateId:
 *                 type: string
 *                 description: ID of the candidate
 *               jobId:
 *                 type: string
 *                 description: ID of the job posting
 *               matchType:
 *                 type: string
 *                 enum: [initial, refined, manual, auto]
 *                 default: auto
 *                 description: Type of matching to perform
 *               includeRecommendations:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to include improvement recommendations
 *     responses:
 *       200:
 *         description: Matching completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 matchId:
 *                   type: string
 *                   description: Unique identifier for this match
 *                 overallScore:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                   description: Overall matching score (0-1)
 *                 skillMatch:
 *                   type: number
 *                   description: Skills matching score
 *                 experienceMatch:
 *                   type: number
 *                   description: Experience matching score
 *                 educationMatch:
 *                   type: number
 *                   description: Education matching score
 *                 locationMatch:
 *                   type: number
 *                   description: Location matching score
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Improvement recommendations
 *                 confidence:
 *                   type: number
 *                   description: AI confidence in the match
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Candidate or job not found
 */
router.post('/match', async (req, res) => {
  try {
    const {
      candidateId,
      jobId,
      matchType = 'auto',
      includeRecommendations = true,
    } = req.body;

    // Generate unique match ID
    const matchId = `match_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const command = {
      matchId,
      candidateId,
      jobId,
      matchType,
      includeRecommendations,
    };

    const result = await cqrsConfig.sendCommand(command);

    res.status(200).json(result);
  } catch (error) {
    console.error('AI matching error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/ai/matching-history:
 *   get:
 *     tags: [AI/NLP]
 *     summary: Get AI matching history
 *     description: Retrieve historical AI matching results with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *         description: Filter by candidate ID
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         description: Filter by job ID
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *         description: Minimum matching score filter
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *         description: Maximum matching score filter
 *       - in: query
 *         name: matchType
 *         schema:
 *           type: string
 *           enum: [initial, refined, manual, auto]
 *         description: Filter by match type
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [matchedAt, overallScore]
 *           default: matchedAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Matching history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       matchId:
 *                         type: string
 *                       candidateId:
 *                         type: string
 *                       jobId:
 *                         type: string
 *                       overallScore:
 *                         type: number
 *                       matchedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalMatches:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     topScore:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/matching-history', async (req, res) => {
  try {
    const query = {
      candidateId: req.query.candidateId,
      jobId: req.query.jobId,
      minScore: req.query.minScore ? parseFloat(req.query.minScore) : undefined,
      maxScore: req.query.maxScore ? parseFloat(req.query.maxScore) : undefined,
      matchType: req.query.matchType,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      sortBy: req.query.sortBy || 'matchedAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await cqrsConfig.sendQuery(query);

    res.status(200).json(result);
  } catch (error) {
    console.error('Matching history error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/ai/parse-cv:
 *   post:
 *     tags: [AI/NLP]
 *     summary: Parse CV/Resume using NLP
 *     description: Extract structured information from CV/Resume using NLP processing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Raw CV/Resume text content
 *               format:
 *                 type: string
 *                 enum: [text, pdf, docx]
 *                 default: text
 *                 description: Format of the CV content
 *     responses:
 *       200:
 *         description: CV parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 parsedData:
 *                   type: object
 *                   properties:
 *                     personalInfo:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         location:
 *                           type: string
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     experience:
 *                       type: array
 *                       items:
 *                         type: object
 *                     education:
 *                       type: array
 *                       items:
 *                         type: object
 *                     languages:
 *                       type: array
 *                       items:
 *                         type: string
 *                 confidence:
 *                   type: number
 *                   description: NLP processing confidence score
 *       400:
 *         description: Invalid CV content
 *       401:
 *         description: Unauthorized
 */
router.post('/parse-cv', async (req, res) => {
  try {
    const { content, format = 'text' } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'CV content is required and must be a string',
      });
    }

    // TODO: Implement CV parsing using AI/NLP service
    // For now, return a placeholder response
    const parsedData = {
      personalInfo: {
        name: 'Parsed from CV',
        email: 'parsed@example.com',
        phone: '+1234567890',
        location: 'Parsed Location',
      },
      skills: ['JavaScript', 'Node.js', 'React'],
      experience: [],
      education: [],
      languages: ['English'],
    };

    res.status(200).json({
      success: true,
      parsedData,
      confidence: 0.85,
      message: 'Phân tích CV hoàn thành (triển khai mẫu)',
    });
  } catch (error) {
    console.error('CV parsing error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/ai/parse-job-description:
 *   post:
 *     tags: [AI/NLP]
 *     summary: Parse job description using NLP
 *     description: Extract structured information from job description using NLP processing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Raw job description text
 *     responses:
 *       200:
 *         description: Job description parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 parsedData:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     requiredSkills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     experienceLevel:
 *                       type: string
 *                     responsibilities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     requirements:
 *                       type: array
 *                       items:
 *                         type: string
 *                     benefits:
 *                       type: array
 *                       items:
 *                         type: string
 *                 confidence:
 *                   type: number
 *                   description: NLP processing confidence score
 *       400:
 *         description: Invalid job description
 *       401:
 *         description: Unauthorized
 */
router.post('/parse-job-description', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Job description is required and must be a string',
      });
    }

    // TODO: Implement job description parsing using AI/NLP service
    // For now, return a placeholder response
    const parsedData = {
      title: 'Parsed Job Title',
      requiredSkills: ['JavaScript', 'Node.js', 'MongoDB'],
      experienceLevel: 'Mid-level',
      responsibilities: ['Develop web applications', 'Maintain codebase'],
      requirements: ['Bachelor degree', '3+ years experience'],
      benefits: ['Health insurance', 'Remote work'],
    };

    res.status(200).json({
      success: true,
      parsedData,
      confidence: 0.82,
      message: 'Phân tích mô tả công việc hoàn thành (triển khai mẫu)',
    });
  } catch (error) {
    console.error('Job description parsing error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
