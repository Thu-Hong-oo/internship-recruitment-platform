const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobRecommendations,
  getJobMatchScore,
  generateSkillRoadmap,
  analyzeJobSkills,
  searchJobs,
  getJobAnalytics,
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getFeaturedJobs,
  getUrgentJobs,
  getHotJobs,
  getJobsByCategory,
  getJobsByLocation,
  getJobBySlug,
  getSimilarJobs,
  getJobStats,
  incrementJobViews,
  getJobsByCompany,
  getJobsBySkills,
  getRecentJobs,
  getPopularJobs
} = require('../controllers/jobController');

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/search', searchJobs);
router.get('/featured', getFeaturedJobs);
router.get('/urgent', getUrgentJobs);
router.get('/hot', getHotJobs);
router.get('/category/:category', getJobsByCategory);
router.get('/location/:location', getJobsByLocation);
router.get('/slug/:slug', getJobBySlug);
router.get('/recent', getRecentJobs);
router.get('/popular', getPopularJobs);
router.get('/company/:companyId', getJobsByCompany);
router.get('/skills', getJobsBySkills);
router.get('/:id', getJob);
router.get('/:id/recommendations', getJobRecommendations);
router.get('/:id/match-score', getJobMatchScore);
router.get('/:id/skill-analysis', analyzeJobSkills);
router.get('/:id/roadmap', generateSkillRoadmap);
router.get('/:id/similar', getSimilarJobs);
router.get('/:id/stats', getJobStats);
router.post('/:id/view', incrementJobViews);

// Protected routes
router.use(protect);

// Job management (employer only)
router.post('/', authorize('employer', 'admin'), createJob);
router.put('/:id', authorize('employer', 'admin'), updateJob);
router.delete('/:id', authorize('employer', 'admin'), deleteJob);

// Application management
router.post('/:id/apply', authorize('candidate'), applyForJob);
router.get('/:id/applications', authorize('employer', 'admin'), getJobApplications);
router.put('/:id/applications/:applicationId', authorize('employer', 'admin'), updateApplicationStatus);

// Analytics (admin/employer only)
router.get('/:id/analytics', authorize('employer', 'admin'), getJobAnalytics);

module.exports = router;

