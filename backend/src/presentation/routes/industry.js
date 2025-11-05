const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getAllIndustries,
  getActiveIndustries,
  searchIndustries,
  getIndustryTrends,
  getIndustryById,
  getIndustryStats,
  getIndustryCompanies,
  getIndustryJobs,
  createIndustry,
  updateIndustry,
  deleteIndustry,
} = require('../controllers/industryController');

// Public routes
router.route('/').get(getAllIndustries);

router.route('/active').get(getActiveIndustries);

router.route('/search').get(searchIndustries);

router.route('/trends').get(getIndustryTrends);

router.route('/:id').get(getIndustryById);

router.route('/:id/stats').get(getIndustryStats);

router.route('/:id/companies').get(getIndustryCompanies);

router.route('/:id/jobs').get(getIndustryJobs);

// Admin routes
router.route('/').post(protect, authorize('admin'), createIndustry);

router
  .route('/:id')
  .patch(protect, authorize('admin'), updateIndustry)
  .delete(protect, authorize('admin'), deleteIndustry);

module.exports = router;
