const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getRoadmaps,
  getRoadmap,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  completeWeek,
  updateProgress,
  getRoadmapAnalytics,
  generateRoadmapFromJob,
  getRecommendedRoadmaps
} = require('../controllers/roadmapController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Roadmap management
router.get('/', getRoadmaps);
router.get('/recommended', getRecommendedRoadmaps);
router.get('/:id', getRoadmap);
router.get('/:id/analytics', getRoadmapAnalytics);
router.post('/', createRoadmap);
router.put('/:id', updateRoadmap);
router.delete('/:id', deleteRoadmap);

// Progress tracking
router.put('/:id/complete-week/:weekNumber', completeWeek);
router.put('/:id/progress/:weekNumber', updateProgress);

// AI-generated roadmaps
router.post('/generate-from-job/:jobId', generateRoadmapFromJob);

module.exports = router;
