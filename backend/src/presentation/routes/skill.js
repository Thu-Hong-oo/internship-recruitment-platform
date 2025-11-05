const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getAllSkills,
  getSkillById,
  searchSkills,
  getSkillCategories,
  getSkillsByCategory,
  getPopularSkills,
  getTrendingSkills,
  getSkillRecommendations,
  getSkillStats,
  createSkill,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');

// Public routes
router.route('/').get(getAllSkills);

router.route('/search').get(searchSkills);

router.route('/categories').get(getSkillCategories);

router.route('/popular').get(getPopularSkills);

router.route('/trending').get(getTrendingSkills);

router.route('/stats').get(getSkillStats);

router.route('/category/:categoryId').get(getSkillsByCategory);

router.route('/:id').get(getSkillById);

// Protected routes
router.use(protect);

// Candidate routes
router
  .route('/recommendations')
  .get(authorize('candidate'), getSkillRecommendations);

// Admin routes
router.route('/').post(authorize('admin'), createSkill);

router
  .route('/:id')
  .put(authorize('admin'), updateSkill)
  .delete(authorize('admin'), deleteSkill);

module.exports = router;
