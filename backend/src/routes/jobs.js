const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  searchJobs,
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
} = require('../controllers/jobController');

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/search', searchJobs);
router.get('/category/:category', getJobsByCategory);
router.get('/subcategory/:subCategory', getJobsBySubCategory);
router.get('/location/:location', getJobsByLocation);
router.get('/district/:district', getJobsByDistrict);
router.get('/slug/:slug', getJobBySlug);
router.get('/recent', getRecentJobs);
router.get('/company/:companyId', getJobsByCompany);
router.get('/skills', getJobsBySkills);
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

// Application management
router.post('/:id/apply', authorize('student'), applyForJob);
router.get(
  '/employer/:id/applications',
  authorize('employer', 'admin'),
  getJobApplications
);

module.exports = router;
