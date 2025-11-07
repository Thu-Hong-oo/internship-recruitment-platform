const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getAllSkills,
  getSkillById,
  getSkillCategories,
  getSkillStats,
  createSkill,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');

// Public routes - Consolidated with query parameters
// GET /api/skills                     → All skills
// GET /api/skills?type=popular        → Popular skills
// GET /api/skills?type=trending       → Trending skills
// GET /api/skills?search=javascript   → Search skills
// GET /api/skills?category=frontend   → Skills by category
router.route('/').get(getAllSkills);

router.route('/categories').get(getSkillCategories);

router.route('/stats').get(getSkillStats);

router.route('/:id').get(getSkillById);

// Protected routes
router.use(protect);

// Admin routes
router.route('/').post(authorize('admin'), createSkill);

router
  .route('/:id')
  .patch(authorize('admin'), updateSkill)
  .delete(authorize('admin'), deleteSkill);

module.exports = router;
