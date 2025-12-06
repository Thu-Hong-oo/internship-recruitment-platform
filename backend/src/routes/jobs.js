const express = require('express');
const { protect, optionalProtect, authorize } = require('../middleware/auth');
const {
  requireEmployerProfile,
  requireVerifiedEmployer,
} = require('../middleware/employerVerification');
const {
  getAllJobs,
  getJob,
  createJob,
  bulkCreateJobs,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  getJobBySlug,
  incrementJobViews,
  getJobCompany,
  getJobStats,
  getRecentJobs,
  submitJobForReview,
  getEmployerJobs,
  getDraftJobs,
  getRelatedJobs,
} = require('../controllers/jobController');
const {
  viewApplicationResume,
} = require('../controllers/applicationController');

const router = express.Router();

// Public routes
router.get('/', getAllJobs); // GET /api/jobs
router.get('/recent', getRecentJobs); // GET /api/jobs/recent
router.get('/slug/:slug', getJobBySlug); // GET /api/jobs/slug/:slug
router.get('/:id/related', getRelatedJobs); // GET /api/jobs/:id/related

router.get(
  '/applications/:applicationId/resume',
  protect,
  authorize('employer', 'admin'),
  requireVerifiedEmployer,
  viewApplicationResume
); // GET /api/jobs/applications/:applicationId/resume

// Protected routes - Employer only (require profile) - BEFORE parameterized routes
router.get(
  '/employer',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  getEmployerJobs
); // GET /api/jobs/employer
router.get(
  '/drafts',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  getDraftJobs
); // GET /api/jobs/drafts

// Public routes with parameters - AFTER specific routes
// Use optionalProtect to check hasApplied if user is authenticated
router.get('/:id', optionalProtect, getJob); // GET /api/jobs/:id
router.get('/:id/company', getJobCompany); // GET /api/jobs/:id/company
router.get('/:id/stats', getJobStats); // GET /api/jobs/:id/stats
router.post(
  '/bulk',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  bulkCreateJobs
); // POST /api/jobs/bulk - Bulk create multiple jobs
router.post(
  '/',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  createJob
); // POST /api/jobs - Create single job

// Protected routes - Employer only (require verification for publishing)
router.put(
  '/:id',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  updateJob
); // PUT /api/jobs/:id
router.delete(
  '/:id',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  deleteJob
); // DELETE /api/jobs/:id
router.get(
  '/:id/applications',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  getJobApplications
); // GET /api/jobs/:id/applications
router.get(
  '/:id/applications/:applicationId/resume',
  protect,
  authorize('employer', 'admin'),
  requireVerifiedEmployer,
  viewApplicationResume
); // GET /api/jobs/:id/applications/:applicationId/resume
router.post(
  '/employer/:id/submit',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  submitJobForReview
); // POST /api/jobs/employer/:id/submit

// Protected routes - Candidate only
router.post('/:id/apply', protect, authorize('candidate'), applyForJob); // POST /api/jobs/:id/apply

// Public route for incrementing views
router.post('/:id/view', incrementJobViews); // POST /api/jobs/:id/view

module.exports = router;
