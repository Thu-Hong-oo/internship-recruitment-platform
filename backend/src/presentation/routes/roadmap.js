const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  generateRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  updateRoadmapProgress,
  completeRoadmapPhase,
  getRoadmapProgress,
  deleteRoadmap,
  getRoadmapRecommendations,
  getRoadmapStats,
} = require('../controllers/roadmapController');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('candidate'));

// Roadmap routes
router.route('/').get(getUserRoadmaps);

router.route('/generate').post(generateRoadmap);

router.route('/recommendations').get(getRoadmapRecommendations);

router.route('/stats').get(getRoadmapStats);

router.route('/:id').get(getRoadmapById).delete(deleteRoadmap);

router
  .route('/:id/progress')
  .get(getRoadmapProgress)
  .patch(updateRoadmapProgress); // PATCH for progress update

router.route('/:id/phases/:phaseId/complete').patch(completeRoadmapPhase); // PATCH for completing phase

module.exports = router;
