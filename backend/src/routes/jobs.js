const express = require('express');
const {
  getAllJobs,
  getJob,
  getJobBySlug,
  incrementJobViews,
  getJobCompany,
  getJobStats,
  getRecentJobs,
} = require('../controllers/jobController');

const router = express.Router();

// Public routes
router.get('/', getAllJobs); // GET /api/jobs
router.get('/recent', getRecentJobs); // GET /api/jobs/recent
router.get('/slug/:slug', getJobBySlug); // GET /api/jobs/slug/:slug

// Public routes with parameters - AFTER specific routes
router.get('/:id', getJob); // GET /api/jobs/:id
router.get('/:id/company', getJobCompany); // GET /api/jobs/:id/company
router.get('/:id/stats', getJobStats); // GET /api/jobs/:id/stats

// Public route for incrementing views
router.post('/:id/view', incrementJobViews); // POST /api/jobs/:id/view

module.exports = router;
