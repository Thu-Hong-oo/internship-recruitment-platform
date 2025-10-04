const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidate/CandidateController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/multerUpload');
const { apiRateLimit } = require('../middleware/globalRateLimit');

// Initialize the new modular controller
const candidateController = new CandidateController();

// Apply authentication to all routes
router.use(protect);
router.use(authorize('candidate'));

// ============================================
// CORE PROFILE MANAGEMENT (2 endpoints)
// ============================================

/**
 * @route   GET /api/v2/candidates/me
 * @desc    Get candidate profile with flexible includes
 * @access  Private (Candidate only)
 * @query   ?include=education,experience,skills,projects,certifications,resume
 * @example GET /api/v2/candidates/me?include=education,experience,skills
 */
router.get('/me', candidateController.getProfile);

/**
 * @route   PATCH /api/v2/candidates/me
 * @desc    Update candidate profile by section
 * @access  Private (Candidate only)
 * @body    { section: "profile" | "visibility" | "preferences", data: {...} }
 * @example PATCH /api/v2/candidates/me
 *          Body: { "section": "profile", "data": { "personalInfo": { "fullName": "John Doe" } } }
 */
router.patch('/me', apiRateLimit, candidateController.updateProfile);

// ============================================
// RESUME MANAGEMENT (3 endpoints) - MUST BE BEFORE :section routes
// ============================================

/**
 * @route   POST /api/v2/candidates/me/resume
 * @desc    Handle resume operations: upload, parse, generate
 * @access  Private (Candidate only)
 * @upload  FormData with file for upload/parse
 * @body    { action: "upload" | "parse" } or query ?action=generate
 * @example POST /api/v2/candidates/me/resume?action=generate
 *          Body: { "template": "modern", "targetJob": "Software Engineer" }
 * @example POST /api/v2/candidates/me/resume
 *          FormData: { file: resume.pdf, action: "upload" }
 */
router.post(
  '/me/resume',
  apiRateLimit,
  upload.single('file'),
  candidateController.handleResume
);

/**
 * @route   GET /api/v2/candidates/me/resume
 * @desc    Get resume data with flexible options
 * @access  Private (Candidate only)
 * @query   ?version=all | ?id=xxx&action=download
 * @example GET /api/v2/candidates/me/resume?version=all
 * @example GET /api/v2/candidates/me/resume?id=507f1f77bcf86cd799439011&action=download
 */
router.get('/me/resume', candidateController.getResume);

/**
 * @route   GET /api/v2/candidates/me/resume/view
 * @desc    Stream current CV inline for viewing in browser
 * @access  Private (Candidate only)
 * @example GET /api/v2/candidates/me/resume/view
 * @returns PDF stream with inline headers for browser display
 */
router.get('/me/resume/view', candidateController.viewCurrentCV);

/**
 * @route   DELETE /api/v2/candidates/me/resume/:id
 * @desc    Delete specific resume version
 * @access  Private (Candidate only)
 * @param   id - Resume ObjectId
 * @example DELETE /api/v2/candidates/me/resume/507f1f77bcf86cd799439011
 */
router.delete('/me/resume/:id', candidateController.deleteResume);

// ============================================
// PROFILE SECTIONS CRUD (4 endpoints pattern)
// ============================================

/**
 * @route   GET /api/v2/candidates/me/:section
 * @desc    Get specific profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @example GET /api/v2/candidates/me/education
 */
router.get('/me/:section', candidateController.getSection);

/**
 * @route   POST /api/v2/candidates/me/:section
 * @desc    Add new entry to profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @body    Section-specific data object
 * @example POST /api/v2/candidates/me/education
 *          Body: { "type": "university", "institution": "Harvard", "degree": "Bachelor" }
 */
router.post('/me/:section', apiRateLimit, candidateController.addToSection);

/**
 * @route   PATCH /api/v2/candidates/me/:section/:id
 * @desc    Update specific entry in profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @param   id - Entry ObjectId
 * @body    Partial update data
 * @example PATCH /api/v2/candidates/me/education/507f1f77bcf86cd799439011
 *          Body: { "degree": "Master", "graduationYear": 2024 }
 */
router.patch('/me/:section/:id', candidateController.updateSectionEntry);

/**
 * @route   DELETE /api/v2/candidates/me/:section/:id
 * @desc    Delete specific entry from profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @param   id - Entry ObjectId
 * @example DELETE /api/v2/candidates/me/education/507f1f77bcf86cd799439011
 */
router.delete('/me/:section/:id', candidateController.deleteSectionEntry);

// ============================================
// APPLICATIONS MANAGEMENT (3 endpoints)
// ============================================

/**
 * @route   GET /api/v2/candidates/applications
 * @desc    Get applications with flexible filtering
 * @access  Private (Candidate only)
 * @query   ?status=pending|reviewing|accepted|rejected&job_id=xxx&page=1&id=xxx
 * @example GET /api/v2/candidates/applications?status=pending&page=1
 * @example GET /api/v2/candidates/applications?id=507f1f77bcf86cd799439011 (for detail)
 */
router.get('/applications', candidateController.getApplications);

/**
 * @route   POST /api/v2/candidates/applications
 * @desc    Apply for a job
 * @access  Private (Candidate only)
 * @body    { job_id, resume_id?, cover_letter?, answers?: [...] }
 * @example POST /api/v2/candidates/applications
 *          Body: { "job_id": "507f1f77bcf86cd799439011", "cover_letter": "I am interested..." }
 */
router.post('/applications', apiRateLimit, candidateController.applyForJob);

/**
 * @route   PATCH /api/v2/candidates/applications/:id
 * @desc    Handle application actions (withdraw)
 * @access  Private (Candidate only)
 * @param   id - Application ObjectId
 * @body    { action: "withdraw" }
 * @example PATCH /api/v2/candidates/applications/507f1f77bcf86cd799439011
 *          Body: { "action": "withdraw" }
 */
router.patch('/applications/:id', candidateController.updateApplication);

// ============================================
// JOBS & COMPANIES (4 endpoints)
// ============================================

/**
 * @route   GET /api/v2/candidates/jobs
 * @desc    Unified job search, saved jobs, company jobs
 * @access  Private (Candidate only)
 * @query   ?keyword=&location=&type=saved|following|search&company_id=&page=1&limit=10
 * @example GET /api/v2/candidates/jobs?keyword=developer&location=hanoi&type=search
 * @example GET /api/v2/candidates/jobs?type=saved
 * @example GET /api/v2/candidates/jobs?type=following
 */
router.get('/jobs', candidateController.getJobs);

/**
 * @route   POST /api/v2/candidates/jobs/:id/action
 * @desc    Handle job actions: save, unsave, apply
 * @access  Private (Candidate only)
 * @param   id - Job ObjectId
 * @body    { action: "save" | "unsave" | "apply", ...additionalData }
 * @example POST /api/v2/candidates/jobs/507f1f77bcf86cd799439011/action
 *          Body: { "action": "save" }
 * @example POST /api/v2/candidates/jobs/507f1f77bcf86cd799439011/action
 *          Body: { "action": "apply", "cover_letter": "I am interested..." }
 */
router.post('/jobs/:id/action', candidateController.handleJobAction);

/**
 * @route   POST /api/v2/candidates/companies/:id/action
 * @desc    Handle company actions: follow, unfollow
 * @access  Private (Candidate only)
 * @param   id - Company ObjectId
 * @body    { action: "follow" | "unfollow" }
 * @example POST /api/v2/candidates/companies/507f1f77bcf86cd799439011/action
 *          Body: { "action": "follow" }
 */
router.post('/companies/:id/action', candidateController.handleCompanyAction);

/**
 * @route   GET /api/v2/candidates/companies
 * @desc    Get companies data: following list or company detail
 * @access  Private (Candidate only)
 * @query   ?type=following | ?id=xxx (for detail)
 * @example GET /api/v2/candidates/companies?type=following
 * @example GET /api/v2/candidates/companies?id=507f1f77bcf86cd799439011
 */
router.get('/companies', candidateController.getCompanies);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// Handle invalid section parameter (exclude resume and other specific endpoints)
router.use('/me/:section/:id?', (req, res, next) => {
  const validSections = [
    'education',
    'experience',
    'skills',
    'projects',
    'certifications',
  ];
  const specialEndpoints = ['resume', 'applications'];

  // Skip validation for special endpoints
  if (specialEndpoints.includes(req.params.section)) {
    return next();
  }

  if (!validSections.includes(req.params.section)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_SECTION',
        message: `Invalid section '${
          req.params.section
        }'. Must be one of: ${validSections.join(', ')}`,
        validSections,
      },
    });
  }
  next();
});

// Handle 404 for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      suggestion: 'Check the API documentation for available endpoints',
    },
  });
});

router.get('candidates/me/resume/view', candidateController.viewCurrentCV);
module.exports = router;
