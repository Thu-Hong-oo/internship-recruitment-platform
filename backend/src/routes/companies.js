const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyJobs,
  getCompanyStats
} = require('../controllers/companyController');

const router = express.Router();

// Public routes
router.get('/', getAllCompanies);
router.get('/:id', getCompany);
router.get('/:id/jobs', getCompanyJobs);
router.get('/:id/stats', getCompanyStats);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createCompany);
router.put('/:id', protect, authorize('admin'), updateCompany);
router.delete('/:id', protect, authorize('admin'), deleteCompany);

module.exports = router;
