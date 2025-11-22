const express = require('express');
const router = express.Router();
const {
  // Skill Management
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  toggleSkillStatus,
  bulkCreateSkills,
  
  // Skill Categories
  getSkillCategories,
  getSkillsByCategory,
  updateSkillCategory,
  
  // Skill Analytics
  getSkillAnalytics,
  getSkillTrends,
  syncSkillPopularity,
  
  // Skill Relationships
  getRelatedSkills,
  updateSkillRelationships,
  
  // Batch Operations
  batchUpdateSkills,
  batchDeleteSkills,
  exportSkills,
  importSkills,
} = require('../../controllers/admin/skillsAdminController');

// NOTE: Parent admin router already applies protect + authorize('admin')

// ========================================
// SKILL MANAGEMENT CRUD
// ========================================

/**
 * @route   GET /api/admin/skills
 * @desc    Get all skills with filters and pagination (Admin view - includes inactive)
 * @access  Private/Admin
 * @query   ?page=1&limit=50&category=&search=&sortBy=name&sortOrder=asc&status=active|inactive|all
 */
router.get('/', getAllSkills);

/**
 * @route   POST /api/admin/skills
 * @desc    Create new skill
 * @access  Private/Admin
 * @body    { name, category, description, aliases, demandLevel, trend }
 */
router.post('/', createSkill);

// ========================================
// STATIC ROUTES (must come before /:id)
// ========================================

/**
 * @route   PATCH /api/admin/skills/:id/toggle-status
 * @desc    Toggle skill active/inactive status
 * @access  Private/Admin
 */
router.patch('/:id/toggle-status', toggleSkillStatus);

// ========================================
// DYNAMIC ROUTES
// ========================================

/**
 * @route   GET /api/admin/skills/:id
 * @desc    Get skill by ID with detailed analytics
 * @access  Private/Admin
 */
router.get('/:id', getSkillById);

/**
 * @route   PUT /api/admin/skills/:id
 * @desc    Update skill
 * @access  Private/Admin
 * @body    Partial skill data
 */
router.put('/:id', updateSkill);

/**
 * @route   DELETE /api/admin/skills/:id
 * @desc    Delete skill (with validation)
 * @access  Private/Admin
 */
router.delete('/:id', deleteSkill);

// ========================================
// BULK OPERATIONS
// ========================================

/**
 * @route   POST /api/admin/skills/bulk
 * @desc    Bulk create skills
 * @access  Private/Admin
 * @body    { skills: [{ name, category, ... }] }
 */
router.post('/bulk/create', bulkCreateSkills);

/**
 * @route   PATCH /api/admin/skills/bulk
 * @desc    Batch update multiple skills
 * @access  Private/Admin
 * @body    { updates: [{ id, data }] }
 */
router.patch('/bulk/update', batchUpdateSkills);

/**
 * @route   DELETE /api/admin/skills/bulk
 * @desc    Batch delete multiple skills
 * @access  Private/Admin
 * @body    { ids: [] }
 */
router.delete('/bulk/delete', batchDeleteSkills);

// ========================================
// CATEGORIES MANAGEMENT
// ========================================

/**
 * @route   GET /api/admin/skills/categories/list
 * @desc    Get all skill categories with stats
 * @access  Private/Admin
 */
router.get('/categories/list', getSkillCategories);

/**
 * @route   GET /api/admin/skills/categories/:category
 * @desc    Get skills by category
 * @access  Private/Admin
 */
router.get('/categories/:category', getSkillsByCategory);

/**
 * @route   PUT /api/admin/skills/categories/:id
 * @desc    Update skill category
 * @access  Private/Admin
 * @body    { category }
 */
router.put('/categories/:id', updateSkillCategory);

// ========================================
// ANALYTICS & INSIGHTS
// ========================================

/**
 * @route   GET /api/admin/skills/analytics/overview
 * @desc    Get skill analytics overview
 * @access  Private/Admin
 */
router.get('/analytics/overview', getSkillAnalytics);

/**
 * @route   GET /api/admin/skills/analytics/trends
 * @desc    Get skill trends and demand data
 * @access  Private/Admin
 * @query   ?period=30d|90d|1y
 */
router.get('/analytics/trends', getSkillTrends);

/**
 * @route   POST /api/admin/skills/analytics/sync
 * @desc    Sync skill popularity from jobs and profiles
 * @access  Private/Admin
 */
router.post('/analytics/sync', syncSkillPopularity);

// ========================================
// SKILL RELATIONSHIPS
// ========================================

/**
 * @route   GET /api/admin/skills/:id/related
 * @desc    Get related skills
 * @access  Private/Admin
 */
router.get('/:id/related', getRelatedSkills);

/**
 * @route   PUT /api/admin/skills/:id/relationships
 * @desc    Update skill relationships
 * @access  Private/Admin
 * @body    { relatedSkills: [], prerequisites: [], alternatives: [] }
 */
router.put('/:id/relationships', updateSkillRelationships);

// ========================================
// IMPORT / EXPORT
// ========================================

/**
 * @route   GET /api/admin/skills/export
 * @desc    Export skills to CSV/JSON
 * @access  Private/Admin
 * @query   ?format=csv|json
 */
router.get('/export', exportSkills);

/**
 * @route   POST /api/admin/skills/import
 * @desc    Import skills from CSV/JSON
 * @access  Private/Admin
 * @body    FormData with file
 */
router.post('/import', importSkills);

module.exports = router;
