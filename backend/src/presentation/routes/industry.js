const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getAllIndustries,
  getIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry,
} = require('../controllers/industryController');

// Public routes - Consolidated with query parameters
// GET /api/industries                    → All industries
// GET /api/industries?type=active        → Active industries
// GET /api/industries?type=trends        → Industry trends
// GET /api/industries?search=software    → Search industries
// GET /api/industries?includeStats=true  → Industries with stats
router.route('/').get(getAllIndustries);

// Industry details with sub-resources via query params
// GET /api/industries/:id                → Industry details
// GET /api/industries/:id?include=stats  → Include statistics
// GET /api/industries/:id?include=companies → Include companies
// GET /api/industries/:id?include=jobs   → Include jobs
router.route('/:id').get(getIndustryById);

// Admin routes
router.route('/').post(protect, authorize('admin'), createIndustry);

router
  .route('/:id')
  .patch(protect, authorize('admin'), updateIndustry)
  .delete(protect, authorize('admin'), deleteIndustry);

module.exports = router;
