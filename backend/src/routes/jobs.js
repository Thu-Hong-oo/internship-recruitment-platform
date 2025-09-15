const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob,
  saveJob,
  unsaveJob,
  getSimilarJobs,
  getJobCategories,
  getTrendingJobs,
  getJobStats,
  searchJobs,
  getJobApplications,
  updateJobStatus,
  getJobAnalytics,
} = require('../controllers/jobController');

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/search', searchJobs);
router.get('/categories', getJobCategories);
router.get('/trending', getTrendingJobs);
router.get('/:id', getJob);
router.get('/:id/similar', getSimilarJobs);

// Protected routes - Employer only
router.post('/', protect, authorize('employer'), createJob);
router.put('/:id', protect, authorize('employer'), updateJob);
router.delete('/:id', protect, authorize('employer'), deleteJob);
router.get('/:id/applications', protect, authorize('employer'), getJobApplications);
router.put('/:id/status', protect, authorize('employer'), updateJobStatus);
router.get('/:id/analytics', protect, authorize('employer'), getJobAnalytics);

// Protected routes - Intern only
router.post('/:id/apply', protect, authorize('intern'), applyForJob);
router.post('/:id/save', protect, authorize('intern'), saveJob);
router.delete('/:id/save', protect, authorize('intern'), unsaveJob);

// Protected routes - Any authenticated user
router.get('/:id/stats', protect, getJobStats);

module.exports = router;
