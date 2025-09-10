const express = require('express');
const router = express.Router();
const {
  getAllSkillCategories,
  getSkillCategoryTree,
  getSkillCategory,
  createSkillCategory,
  updateSkillCategory,
  deleteSkillCategory,
  getPopularSkillCategories,
  searchSkillCategories,
  updateCategoryStats,
} = require('../controllers/skillCategoryController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllSkillCategories);
router.get('/tree', getSkillCategoryTree);
router.get('/popular', getPopularSkillCategories);
router.get('/search', searchSkillCategories);
router.get('/:id', getSkillCategory);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createSkillCategory);
router.put('/:id', protect, authorize('admin'), updateSkillCategory);
router.delete('/:id', protect, authorize('admin'), deleteSkillCategory);
router.put('/:id/stats', protect, authorize('admin'), updateCategoryStats);

module.exports = router;

