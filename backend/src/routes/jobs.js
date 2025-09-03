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
  updateApplicationStatus
} = require('../controllers/jobController');

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/search', searchJobs);
router.get('/:id', getJob);
router.get('/:id/recommendations', getJobRecommendations);
router.get('/:id/match-score', getJobMatchScore);
router.get('/:id/skill-analysis', analyzeJobSkills);
router.get('/:id/roadmap', generateSkillRoadmap);

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

