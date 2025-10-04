const express = require('express');
const router = express.Router();
const aiCandidateController = require('../controllers/aiCandidateController');
const { protect, authorize } = require('../middleware/auth');
const { body, query, param } = require('express-validator');
const validate = require('../middleware/validate');
const rateLimit = require('express-rate-limit');

// Rate limiting for AI endpoints (more restrictive due to computational cost)
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const heavyAIRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit heavy operations like resume analysis
  message: 'Too many heavy AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// RECOMMENDATIONS & MATCHING ROUTES (2 routes)
// ============================================

/**
 * @route   GET /api/v2/ai/candidates/recommendations
 * @desc    Get unified AI recommendations for jobs, skills, courses, career paths, or similar jobs
 * @access  Private (Candidate only)
 * @query   {string} type - Type of recommendations: "jobs" | "skills" | "courses" | "career-paths" | "similar-jobs"
 * @query   {string} [job_id] - Required for "similar-jobs" type
 * @query   {number} [limit=10] - Number of recommendations to return
 * @query   {string} [current_role] - Current role for career path recommendations
 * @query   {string} [target_role] - Target role for career path recommendations
 * @example GET /api/v2/ai/candidates/recommendations?type=jobs&limit=5
 * @example GET /api/v2/ai/candidates/recommendations?type=similar-jobs&job_id=507f1f77bcf86cd799439011&limit=3
 * @example GET /api/v2/ai/candidates/recommendations?type=career-paths&current_role=intern&target_role=senior-developer
 */
router.get(
  '/recommendations',
  auth.protect,
  auth.restrictTo('candidate'),
  aiRateLimit,
  [
    query('type')
      .isIn(['jobs', 'skills', 'courses', 'career-paths', 'similar-jobs'])
      .withMessage(
        'Type must be one of: jobs, skills, courses, career-paths, similar-jobs'
      ),
    query('job_id').optional().isMongoId().withMessage('Invalid job ID format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('current_role')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Current role must be between 2 and 100 characters'),
    query('target_role')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Target role must be between 2 and 100 characters'),
  ],
  validate,
  aiCandidateController.getRecommendations
);

/**
 * @route   GET/POST /api/v2/ai/candidates/matching
 * @desc    Get unified job matching analysis with score, compatibility, fit analysis, or job comparison
 * @access  Private (Candidate only)
 * @query   {string} [job_id] - Job ID for single job analysis (required for score, analysis, fit)
 * @query   {string} [action=score] - Action type: "score" | "analysis" | "fit" | "compare"
 * @query   {string} [job_ids] - Comma-separated job IDs for comparison (used with compare action)
 * @body    {string[]} [job_ids] - Array of job IDs for comparison (POST only, used with compare action)
 * @example GET /api/v2/ai/candidates/matching?job_id=507f1f77bcf86cd799439011&action=score
 * @example GET /api/v2/ai/candidates/matching?job_id=507f1f77bcf86cd799439011&action=analysis
 * @example POST /api/v2/ai/candidates/matching?action=compare {"job_ids": ["id1", "id2", "id3"]}
 */
router
  .route('/matching')
  .get(
    auth.protect,
    auth.restrictTo('candidate'),
    aiRateLimit,
    [
      query('job_id')
        .optional()
        .isMongoId()
        .withMessage('Invalid job ID format'),
      query('action')
        .optional()
        .isIn(['score', 'analysis', 'fit', 'compare'])
        .withMessage('Action must be one of: score, analysis, fit, compare'),
      query('job_ids')
        .optional()
        .custom(value => {
          if (value) {
            const ids = value.split(',');
            if (ids.length < 2 || ids.length > 10) {
              throw new Error(
                'Job IDs must be between 2 and 10 for comparison'
              );
            }
            // Validate each ID is a valid MongoDB ObjectId
            ids.forEach(id => {
              if (!/^[0-9a-fA-F]{24}$/.test(id.trim())) {
                throw new Error('Invalid job ID format in comparison list');
              }
            });
          }
          return true;
        }),
    ],
    validate,
    aiCandidateController.getJobMatching
  )
  .post(
    auth.protect,
    auth.restrictTo('candidate'),
    aiRateLimit,
    [
      query('action')
        .optional()
        .isIn(['score', 'analysis', 'fit', 'compare'])
        .withMessage('Action must be one of: score, analysis, fit, compare'),
      body('job_ids')
        .optional()
        .isArray({ min: 2, max: 10 })
        .withMessage('Job IDs array must contain between 2 and 10 items'),
      body('job_ids.*')
        .optional()
        .isMongoId()
        .withMessage('Each job ID must be a valid MongoDB ObjectId'),
    ],
    validate,
    aiCandidateController.getJobMatching
  );

// ============================================
// SEARCH & RESUME AI ROUTES (3 routes)
// ============================================

/**
 * @route   POST /api/v2/ai/candidates/search
 * @desc    Perform semantic search for jobs and companies using AI
 * @access  Private (Candidate only)
 * @body    {string} query - Semantic search query
 * @body    {string} [type=jobs] - Search type: "jobs" | "companies"
 * @example POST /api/v2/ai/candidates/search {"query": "machine learning positions at startups", "type": "jobs"}
 */
router.post(
  '/search',
  auth.protect,
  auth.restrictTo('candidate'),
  aiRateLimit,
  [
    body('query')
      .notEmpty()
      .isLength({ min: 3, max: 500 })
      .withMessage('Search query must be between 3 and 500 characters'),
    body('type')
      .optional()
      .isIn(['jobs', 'companies'])
      .withMessage('Search type must be "jobs" or "companies"'),
  ],
  validate,
  aiCandidateController.semanticSearch
);

/**
 * @route   POST /api/v2/ai/candidates/resume
 * @desc    Unified resume AI operations for analysis, optimization, scoring, and ATS checking
 * @access  Private (Candidate only)
 * @body    {string} [resume_id] - Resume ID (optional, uses current resume if not provided)
 * @body    {string} action - Action type: "analyze" | "optimize" | "score" | "ats-check"
 * @body    {string} [target_job_id] - Target job ID for optimization and scoring
 * @example POST /api/v2/ai/candidates/resume {"action": "analyze"}
 * @example POST /api/v2/ai/candidates/resume {"action": "optimize", "target_job_id": "507f1f77bcf86cd799439011"}
 */
router.post(
  '/resume',
  auth.protect,
  auth.restrictTo('candidate'),
  heavyAIRateLimit,
  [
    body('resume_id')
      .optional()
      .isMongoId()
      .withMessage('Invalid resume ID format'),
    body('action')
      .notEmpty()
      .isIn(['analyze', 'optimize', 'score', 'ats-check'])
      .withMessage(
        'Action must be one of: analyze, optimize, score, ats-check'
      ),
    body('target_job_id')
      .optional()
      .isMongoId()
      .withMessage('Invalid target job ID format'),
  ],
  validate,
  aiCandidateController.handleResumeAI
);

/**
 * @route   POST /api/v2/ai/candidates/resume/builder
 * @desc    AI-powered resume content generation for summaries, bullet points, skills, and job tailoring
 * @access  Private (Candidate only)
 * @body    {string} action - Action type: "summary" | "bullets" | "skills" | "tailor"
 * @body    {object} [data] - Additional data for content generation (e.g., experience details for bullets)
 * @body    {string} [job_id] - Job ID for tailored content generation
 * @example POST /api/v2/ai/candidates/resume/builder {"action": "summary"}
 * @example POST /api/v2/ai/candidates/resume/builder {"action": "bullets", "data": {"position": "Software Intern", "company": "TechCorp"}}
 * @example POST /api/v2/ai/candidates/resume/builder {"action": "tailor", "job_id": "507f1f77bcf86cd799439011"}
 */
router.post(
  '/resume/builder',
  auth.protect,
  auth.restrictTo('candidate'),
  heavyAIRateLimit,
  [
    body('action')
      .notEmpty()
      .isIn(['summary', 'bullets', 'skills', 'tailor'])
      .withMessage('Action must be one of: summary, bullets, skills, tailor'),
    body('data').optional().isObject().withMessage('Data must be an object'),
    body('job_id').optional().isMongoId().withMessage('Invalid job ID format'),
  ],
  validate,
  aiCandidateController.resumeBuilder
);

// ============================================
// CAREER DEVELOPMENT ROUTES (2 routes)
// ============================================

/**
 * @route   GET /api/v2/ai/candidates/career
 * @desc    Unified career development endpoint for paths, skill gap analysis, and learning recommendations
 * @access  Private (Candidate only)
 * @query   {string} type - Type of analysis: "path" | "skill-gap" | "learning"
 * @query   {string} [current_role] - Current role for career path analysis
 * @query   {string} [target_role] - Target role for career development
 * @query   {string} [skill] - Specific skill for learning path recommendations
 * @query   {string} [level=beginner] - Skill level: "beginner" | "intermediate" | "advanced"
 * @example GET /api/v2/ai/candidates/career?type=path&current_role=intern&target_role=senior-developer
 * @example GET /api/v2/ai/candidates/career?type=skill-gap&target_role=data-scientist
 * @example GET /api/v2/ai/candidates/career?type=learning&skill=react&level=intermediate
 */
router.get(
  '/career',
  auth.protect,
  auth.restrictTo('candidate'),
  aiRateLimit,
  [
    query('type')
      .notEmpty()
      .isIn(['path', 'skill-gap', 'learning'])
      .withMessage('Type must be one of: path, skill-gap, learning'),
    query('current_role')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Current role must be between 2 and 100 characters'),
    query('target_role')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Target role must be between 2 and 100 characters'),
    query('skill')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Skill must be between 1 and 50 characters'),
    query('level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Level must be one of: beginner, intermediate, advanced'),
  ],
  validate,
  aiCandidateController.getCareerDevelopment
);

/**
 * @route   POST /api/v2/ai/candidates/career/:pathId
 * @desc    Handle career path actions like selecting or enrolling in learning paths
 * @access  Private (Candidate only)
 * @param   {string} pathId - Career path or learning path ID
 * @body    {string} action - Action type: "select" | "enroll"
 * @example POST /api/v2/ai/candidates/career/507f1f77bcf86cd799439011 {"action": "select"}
 * @example POST /api/v2/ai/candidates/career/507f1f77bcf86cd799439011 {"action": "enroll"}
 */
router.post(
  '/career/:pathId',
  auth.protect,
  auth.restrictTo('candidate'),
  aiRateLimit,
  [
    param('pathId').isMongoId().withMessage('Invalid path ID format'),
    body('action')
      .notEmpty()
      .isIn(['select', 'enroll'])
      .withMessage('Action must be one of: select, enroll'),
  ],
  validate,
  aiCandidateController.handleCareerPath
);

// ============================================
// INTERVIEW PREPARATION ROUTE (1 route)
// ============================================

/**
 * @route   POST /api/v2/ai/candidates/interview
 * @desc    Interview preparation and mock interview evaluation
 * @access  Private (Candidate only)
 * @body    {string} job_id - Job ID for interview preparation
 * @body    {string} action - Action type: "prep" | "mock"
 * @body    {string[]} [questions] - Interview questions for mock interview (required for "mock" action)
 * @body    {string[]} [answers] - Candidate answers for mock interview (required for "mock" action)
 * @example POST /api/v2/ai/candidates/interview {"job_id": "507f1f77bcf86cd799439011", "action": "prep"}
 * @example POST /api/v2/ai/candidates/interview {"job_id": "507f1f77bcf86cd799439011", "action": "mock", "questions": ["Tell me about yourself"], "answers": ["I am a passionate developer..."]}
 */
router.post(
  '/interview',
  auth.protect,
  auth.restrictTo('candidate'),
  heavyAIRateLimit,
  [
    body('job_id')
      .notEmpty()
      .isMongoId()
      .withMessage('Valid job ID is required'),
    body('action')
      .notEmpty()
      .isIn(['prep', 'mock'])
      .withMessage('Action must be one of: prep, mock'),
    body('questions')
      .if(body('action').equals('mock'))
      .notEmpty()
      .isArray({ min: 1, max: 20 })
      .withMessage(
        'Questions array is required for mock interviews (1-20 questions)'
      ),
    body('questions.*')
      .if(body('action').equals('mock'))
      .isLength({ min: 5, max: 1000 })
      .withMessage('Each question must be between 5 and 1000 characters'),
    body('answers')
      .if(body('action').equals('mock'))
      .notEmpty()
      .isArray({ min: 1, max: 20 })
      .withMessage(
        'Answers array is required for mock interviews (1-20 answers)'
      ),
    body('answers.*')
      .if(body('action').equals('mock'))
      .isLength({ min: 10, max: 2000 })
      .withMessage('Each answer must be between 10 and 2000 characters'),
  ],
  validate,
  aiCandidateController.handleInterview
);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// Handle 404 for AI routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `AI endpoint ${req.originalUrl} not found`,
    available_endpoints: [
      'GET /api/v2/ai/candidates/recommendations',
      'GET/POST /api/v2/ai/candidates/matching',
      'POST /api/v2/ai/candidates/search',
      'POST /api/v2/ai/candidates/resume',
      'POST /api/v2/ai/candidates/resume/builder',
      'GET /api/v2/ai/candidates/career',
      'POST /api/v2/ai/candidates/career/:pathId',
      'POST /api/v2/ai/candidates/interview',
    ],
  });
});

module.exports = router;
