const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { noCache, shortCache } = require('../middleware/cacheControl');
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
router.get('/', shortCache(), getRoadmaps); // Cache 1 min
router.get('/recommended', shortCache(), getRecommendedRoadmaps);
router.get('/:id', shortCache(), getRoadmap);
router.get('/:id/analytics', shortCache(), getRoadmapAnalytics);
router.post('/', noCache(), createRoadmap); // No cache for creation
router.put('/:id', noCache(), updateRoadmap);
router.delete('/:id', noCache(), deleteRoadmap);

// Progress tracking
router.put('/:id/complete-week/:weekNumber', noCache(), completeWeek);
router.put('/:id/progress/:weekNumber', noCache(), updateProgress);

// AI-generated roadmaps (NO CACHE - algorithm improvements)
router.post('/generate-from-job/:jobId', noCache(), generateRoadmapFromJob);

module.exports = router;
