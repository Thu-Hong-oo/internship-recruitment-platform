const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  requireEmployerProfile,
  requireVerifiedEmployer,
} = require('../middleware/employerVerification');
const {
  getAllJobs,
  getJob,
  createJob,
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
} = require('../controllers/jobController');

const router = express.Router();

// Public routes
router.get('/', getAllJobs); // GET /api/jobs
router.get('/recent', getRecentJobs); // GET /api/jobs/recent
router.get('/slug/:slug', getJobBySlug); // GET /api/jobs/slug/:slug

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
router.get('/:id', getJob); // GET /api/jobs/:id
router.get('/:id/company', getJobCompany); // GET /api/jobs/:id/company
router.get('/:id/stats', getJobStats); // GET /api/jobs/:id/stats
router.post(
  '/',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  createJob
); // POST /api/jobs

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
