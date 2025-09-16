const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  getSkillCategories,
  getSkillsByCategory,
  getPopularSkills,
  searchSkills
} = require('../controllers/skillController');

const router = express.Router();

// Public routes
router.get('/', getAllSkills);
router.get('/categories', getSkillCategories);
router.get('/category/:category', getSkillsByCategory);
router.get('/popular', getPopularSkills);
router.get('/search', searchSkills);
router.get('/:id', getSkill);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createSkill);
router.put('/:id', protect, authorize('admin'), updateSkill);
router.delete('/:id', protect, authorize('admin'), deleteSkill);

module.exports = router;
