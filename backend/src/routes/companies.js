const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyJobs,
  getMyCompany,
  updateMyCompany,
  getCompanyStats,
  updateMyCompanyLogo,
} = require('../controllers/companyController');

const router = express.Router();

// ========================================
// EMPLOYER ROUTES (Must be BEFORE /:id routes)
// ========================================
router.get('/me', protect, authorize('employer'), getMyCompany);
router.post('/', protect, authorize('employer'), createCompany);
router.put('/me', protect, authorize('employer'), updateMyCompany);
router.put('/me/logo', protect, authorize('employer'), updateMyCompanyLogo);

// ========================================
// PUBLIC ROUTES
// ========================================
router.get('/', getAllCompanies);
router.get('/:id', getCompany);
router.get('/:id/jobs', getCompanyJobs);
router.get('/:id/stats', getCompanyStats);

// ========================================
// ADMIN/OWNER ROUTES
// ========================================
router.put('/:id', protect, updateCompany);
router.delete('/:id', protect, authorize('admin'), deleteCompany);

module.exports = router;
