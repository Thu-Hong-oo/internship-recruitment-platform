const express = require('express');
const router = express.Router();
const {
  getAllIndustries,
  getIndustryByCode,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  getIndustryAnalytics,
  syncIndustryStats,
  bulkCreateIndustries,
  getIndustryHierarchy,
  updateIndustrySortOrder,
} = require('../../controllers/admin/industriesAdminController');

// NOTE: parent admin router already applies protect + authorize('admin')

// ========================================
// INDUSTRY MANAGEMENT CRUD
// ========================================

/**
 * @route   GET /api/admin/industries
 * @desc    Get all industries with filters (including hidden)
 * @access  Private/Admin
 * @query   ?q=search&parent=root|code&includeStats=true
 */
router.get('/', getAllIndustries);

/**
 * @route   GET /api/admin/industries/hierarchy
 * @desc    Get industry hierarchy tree
 * @access  Private/Admin
 */
router.get('/hierarchy', getIndustryHierarchy);

/**
 * @route   POST /api/admin/industries
 * @desc    Create new industry
 * @access  Private/Admin
 * @body    { code, name, description, parentCode, ... }
 */
router.post('/', createIndustry);

// ========================================
// ANALYTICS & BULK OPERATIONS
// ========================================
// NOTE: These routes MUST come BEFORE /:code routes to avoid conflicts

/**
 * @route   GET /api/admin/industries/analytics/overview
 * @desc    Get industry analytics overview
 * @access  Private/Admin
 */
router.get('/analytics/overview', getIndustryAnalytics);

/**
 * @route   POST /api/admin/industries/analytics/sync
 * @desc    Sync industry statistics from jobs and profiles
 * @access  Private/Admin
 */
router.post('/analytics/sync', syncIndustryStats);

/**
 * @route   POST /api/admin/industries/bulk
 * @desc    Bulk create industries
 * @access  Private/Admin
 * @body    { industries: [{ code, name, ... }] }
 */
router.post('/bulk', bulkCreateIndustries);

/**
 * @route   PUT /api/admin/industries/sort-order
 * @desc    Update sort order for multiple industries
 * @access  Private/Admin
 * @body    { updates: [{ code, sortOrder }] }
 */
router.put('/sort-order', updateIndustrySortOrder);

// ========================================
// DYNAMIC ROUTES (MUST BE LAST)
// ========================================

/**
 * @route   GET /api/admin/industries/:code
 * @desc    Get industry by code with detailed stats
 * @access  Private/Admin
 */
router.get('/:code', getIndustryByCode);

/**
 * @route   PUT /api/admin/industries/:code
 * @desc    Update industry
 * @access  Private/Admin
 * @body    Partial industry data
 */
router.put('/:code', updateIndustry);

/**
 * @route   DELETE /api/admin/industries/:code
 * @desc    Delete industry (with validation)
 * @access  Private/Admin
 */
router.delete('/:code', deleteIndustry);

module.exports = router;
