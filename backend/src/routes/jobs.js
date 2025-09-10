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
  getJobsByCategory,
  getJobsBySubCategory,
  getJobsByLocation,
  getJobsByDistrict,
  incrementJobViews,
  getJobsByCompany,
  getJobsBySkills,
  getRecentJobs,
  getJobCompany,
  getJobStats,
  submitJobForReview,
} = require('../controllers/jobController');

const router = express.Router();

// Public routes (consolidated: use /api/jobs with query filters)
router.get('/', getAllJobs);
router.get('/search', getAllJobs); // alias to listing with q filter
router.get('/slug/:slug', getJobBySlug);
router.get('/:id', getJob);
router.get('/:id/stats', getJobStats);
router.get('/:id/company', getJobCompany);
router.post('/:id/view', incrementJobViews);

// Protected routes
router.use(protect);

// Employer namespace: clearer semantics
router.post('/employer', authorize('employer', 'admin'), createJob);
router.put('/employer/:id', authorize('employer', 'admin'), updateJob);
router.delete('/employer/:id', authorize('employer', 'admin'), deleteJob);
router.post('/employer/:id/submit', authorize('employer', 'admin'), submitJobForReview);

// Application management
router.post('/:id/apply', authorize('student'), applyForJob);
router.get(
  '/employer/:id/applications',
  authorize('employer', 'admin'),
  getJobApplications
);

module.exports = router;
