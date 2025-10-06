const express = require('express');
const router = express.Router();
const CandidateController = require('../../controllers/candidate/CandidateController');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/multerUpload');
const { apiRateLimit } = require('../../middleware/globalRateLimit');

// Import CV Builder routes
const cvBuilderRoutes = require('../candidate/cvBuilderRoutes');

// Initialize the new modular controller
const candidateController = new CandidateController();

// Apply authentication to all routes
router.use(protect);
router.use(authorize('candidate'));

// ============================================
// CV BUILDER ROUTES
// ============================================
router.use('/me/cv-builder', cvBuilderRoutes);

// ============================================
// CORE PROFILE MANAGEMENT (2 endpoints)
// ============================================

/**
 * @route   GET /api/candidates/me
 * @desc    Get candidate profile with flexible includes
 * @access  Private (Candidate only)
 * @query   ?include=education,experience,skills,projects,certifications,resume
 * @example GET /api/candidates/me?include=education,experience,skills
 */
router.get('/me', candidateController.getProfile);

/**
 * @route   PATCH /api/candidates/me
 * @desc    Update candidate profile by section
 * @access  Private (Candidate only)
 * @body    { section: "profile" | "visibility" | "preferences", data: {...} }
 * @example PATCH /api/candidates/me
 *          Body: { "section": "profile", "data": { "personalInfo": { "fullName": "John Doe" } } }
 */
router.patch('/me', apiRateLimit, candidateController.updateProfile);

// ============================================
// RESUME MANAGEMENT (3 endpoints) - MUST BE BEFORE :section routes
// ============================================

/**
 * @route   POST /api/candidates/me/resume
 * @desc    Handle resume operations: upload, parse, generate
 * @access  Private (Candidate only)
 * @upload  FormData with file for upload/parse
 * @body    { action: "upload" | "parse" } or query ?action=generate
 * @example POST /api/candidates/me/resume?action=generate
 *          Body: { "template": "modern", "targetJob": "Software Engineer" }
 * @example POST /api/candidates/me/resume
 *          FormData: { file: resume.pdf, action: "upload" }
 */
router.post(
  '/me/resume',
  apiRateLimit,
  upload.single('file'),
  candidateController.handleResume
);

/**
 * @route   GET /api/candidates/me/resume
 * @desc    Get resume data with flexible options
 * @access  Private (Candidate only)
 * @query   ?version=all | ?id=current|ObjectId&action=download
 * @example GET /api/candidates/me/resume?version=all
 * @example GET /api/candidates/me/resume?id=current&action=download
 * @example GET /api/candidates/me/resume?id=507f1f77bcf86cd799439011&action=download
 */
router.get('/me/resume', candidateController.getResume);

/**
 * @route   GET /api/candidates/me/resume/view/:id?
 * @desc    Stream CV for viewing in browser (current or by ID)
 * @access  Private (Candidate only)
 * @param   id - Optional. "current" for current CV, ObjectId for history CV, or omit for current
 * @example GET /api/candidates/me/resume/view
 * @example GET /api/candidates/me/resume/view/current
 * @example GET /api/candidates/me/resume/view/507f1f77bcf86cd799439011
 * @returns File stream with inline headers for browser display
 */
router.get('/me/resume/view/:id?', candidateController.viewCurrentCV);

// ============================================
// AI RESUME GENERATION (2 endpoints)
// ============================================

/**
 * @route   POST /api/candidates/me/resume/generate
 * @desc    Generate AI-enhanced resume from profile
 * @access  Private (Candidate only)
 * @body    { template: "modern"|"classic", targetJob: "Job Title", format: "html"|"pdf" }
 * @example POST /api/candidates/me/resume/generate
 *          Body: { "template": "modern", "targetJob": "Software Engineer", "format": "html" }
 */
router.post('/me/resume/generate', candidateController.generateSmartResume);

/**
 * @route   POST /api/candidates/me/resume/generate/:jobId
 * @desc    Generate AI-enhanced resume targeted for specific job
 * @access  Private (Candidate only)
 * @param   jobId - Job ID to target
 * @body    { template: "modern"|"classic", format: "html"|"pdf" }
 * @example POST /api/candidates/me/resume/generate/507f1f77bcf86cd799439011
 *          Body: { "template": "modern", "format": "html" }
 */
router.post(
  '/me/resume/generate/:jobId',
  candidateController.generateTargetedResume
);

/**
 * @route   DELETE /api/candidates/me/resume/:id
 * @desc    Delete CV by ID (current or history)
 * @access  Private (Candidate only)
 * @param   id - "current" to delete current CV, or ObjectId to delete from history
 * @example DELETE /api/candidates/me/resume/current
 * @example DELETE /api/candidates/me/resume/507f1f77bcf86cd799439011
 */
router.delete('/me/resume/:id', candidateController.deleteResume);

/**
 * @route   PUT /api/candidates/me/resume/set-current/:id
 * @desc    Set CV from history as current by ID (swap current ↔ history)
 * @access  Private (Candidate only)
 * @param   id - CV ObjectId from history
 * @example PUT /api/candidates/me/resume/set-current/507f1f77bcf86cd799439011
 */
router.put('/me/resume/set-current/:id', candidateController.setCurrentResume);

/**
 * @route   PUT /api/candidates/me/resume/rename
 * @desc    Rename CV display name by ID (current or history)
 * @access  Private (Candidate only)
 * @body    { id: string, displayName: string }
 * @example PUT /api/candidates/me/resume/rename
 *          Body: { "id": "current", "displayName": "My New CV Name" }
 * @example PUT /api/candidates/me/resume/rename
 *          Body: { "id": "507f1f77bcf86cd799439011", "displayName": "Old CV Name" }
 */
router.put('/me/resume/rename', candidateController.renameResume);

// ============================================
// PROFILE SECTIONS CRUD (4 endpoints pattern)
// ============================================

/**
 * @route   GET /api/candidates/me/:section
 * @desc    Get specific profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @example GET /api/candidates/me/education
 */
router.get('/me/:section', candidateController.getSection);

/**
 * @route   POST /api/candidates/me/:section
 * @desc    Add new entry to profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @body    Section-specific data object
 * @example POST /api/candidates/me/education
 *          Body: { "type": "university", "institution": "Harvard", "degree": "Bachelor" }
 */
router.post('/me/:section', apiRateLimit, candidateController.addToSection);

/**
 * @route   PATCH /api/candidates/me/:section/:id
 * @desc    Update specific entry in profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @param   id - Entry ObjectId
 * @body    Partial update data
 * @example PATCH /api/candidates/me/education/507f1f77bcf86cd799439011
 *          Body: { "degree": "Master", "graduationYear": 2024 }
 */
router.patch('/me/:section/:id', candidateController.updateSectionEntry);

/**
 * @route   DELETE /api/candidates/me/:section/:id
 * @desc    Delete specific entry from profile section
 * @access  Private (Candidate only)
 * @param   section - education | experience | skills | projects | certifications
 * @param   id - Entry ObjectId
 * @example DELETE /api/candidates/me/education/507f1f77bcf86cd799439011
 */
router.delete('/me/:section/:id', candidateController.deleteSectionEntry);

// ============================================
// APPLICATIONS MANAGEMENT (3 endpoints)
// ============================================

/**
 * @route   GET /api/candidates/applications
 * @desc    Get applications with flexible filtering
 * @access  Private (Candidate only)
 * @query   ?status=pending|reviewing|accepted|rejected&job_id=xxx&page=1&id=xxx
 * @example GET /api/candidates/applications?status=pending&page=1
 * @example GET /api/candidates/applications?id=507f1f77bcf86cd799439011 (for detail)
 */
router.get('/applications', candidateController.getApplications);

/**
 * @route   POST /api/candidates/applications
 * @desc    Apply for a job
 * @access  Private (Candidate only)
 * @body    { job_id, resume_id?, cover_letter?, answers?: [...] }
 * @example POST /api/candidates/applications
 *          Body: { "job_id": "507f1f77bcf86cd799439011", "cover_letter": "I am interested..." }
 */
router.post('/applications', apiRateLimit, candidateController.applyForJob);

/**
 * @route   PATCH /api/candidates/applications/:id
 * @desc    Handle application actions (withdraw)
 * @access  Private (Candidate only)
 * @param   id - Application ObjectId
 * @body    { action: "withdraw" }
 * @example PATCH /api/candidates/applications/507f1f77bcf86cd799439011
 *          Body: { "action": "withdraw" }
 */
router.patch('/applications/:id', candidateController.updateApplication);

// ============================================
// JOBS & COMPANIES (4 endpoints)
// ============================================

/**
 * @route   GET /api/candidates/jobs
 * @desc    Unified job search, saved jobs, company jobs
 * @access  Private (Candidate only)
 * @query   ?keyword=&location=&type=saved|following|search&company_id=&page=1&limit=10
 * @example GET /api/candidates/jobs?keyword=developer&location=hanoi&type=search
 * @example GET /api/candidates/jobs?type=saved
 * @example GET /api/candidates/jobs?type=following
 */
router.get('/jobs', candidateController.getJobs);

/**
 * @route   POST /api/candidates/jobs/:id/action
 * @desc    Handle job actions: save, unsave, apply
 * @access  Private (Candidate only)
 * @param   id - Job ObjectId
 * @body    { action: "save" | "unsave" | "apply", ...additionalData }
 * @example POST /api/candidates/jobs/507f1f77bcf86cd799439011/action
 *          Body: { "action": "save" }
 * @example POST /api/candidates/jobs/507f1f77bcf86cd799439011/action
 *          Body: { "action": "apply", "cover_letter": "I am interested..." }
 */
router.post('/jobs/:id/action', candidateController.handleJobAction);

/**
 * @route   POST /api/candidates/companies/:id/action
 * @desc    Handle company actions: follow, unfollow
 * @access  Private (Candidate only)
 * @param   id - Company ObjectId
 * @body    { action: "follow" | "unfollow" }
 * @example POST /api/candidates/companies/507f1f77bcf86cd799439011/action
 *          Body: { "action": "follow" }
 */
router.post('/companies/:id/action', candidateController.handleCompanyAction);

/**
 * @route   GET /api/candidates/companies
 * @desc    Get companies data: following list or company detail
 * @access  Private (Candidate only)
 * @query   ?type=following | ?id=xxx (for detail)
 * @example GET /api/candidates/companies?type=following
 * @example GET /api/candidates/companies?id=507f1f77bcf86cd799439011
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
