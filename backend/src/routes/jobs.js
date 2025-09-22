
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
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
} = require('../controllers/jobController');

const router = express.Router();

// Public routes
router.get('/', getAllJobs); // GET /api/jobs
router.get('/recent', getRecentJobs); // GET /api/jobs/recent
router.get('/slug/:slug', getJobBySlug); // GET /api/jobs/slug/:slug
router.get('/:id', getJob); // GET /api/jobs/:id
router.get('/:id/company', getJobCompany); // GET /api/jobs/:id/company
router.get('/:id/stats', getJobStats); // GET /api/jobs/:id/stats

// Protected routes - Employer only
router.post('/', protect, authorize('employer'), createJob); // POST /api/jobs
router.put('/:id', protect, authorize('employer'), updateJob); // PUT /api/jobs/:id
router.delete('/:id', protect, authorize('employer'), deleteJob); // DELETE /api/jobs/:id
router.get('/:id/applications', protect, authorize('employer'), getJobApplications); // GET /api/jobs/:id/applications
router.post('/employer/:id/submit', protect, authorize('employer'), submitJobForReview); // POST /api/jobs/employer/:id/submit

// Protected routes - Candidate only
router.post('/:id/apply', protect, authorize('candidate'), applyForJob); // POST /api/jobs/:id/apply

// Public route for incrementing views
router.post('/:id/view', incrementJobViews); // POST /api/jobs/:id/view

module.exports = router;
