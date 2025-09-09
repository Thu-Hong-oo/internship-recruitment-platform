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

// Public routes
router.get('/', getAllCompanies);

// Protected routes (Employer) — must be before any '/:id' routes to avoid 'me' being treated as an id
router.get('/me', protect, authorize('employer'), getMyCompany);
router.post('/', protect, authorize('employer'), createCompany);
router.put('/me', protect, authorize('employer'), updateMyCompany);
router.put('/me/logo', protect, authorize('employer'), updateMyCompanyLogo);

// Public routes with :id
router.get('/:id', getCompany);
router.get('/:id/jobs', getCompanyJobs);
router.get('/:id/stats', getCompanyStats);

// Protected routes (Admin/Owner)
router.put('/:id', protect, updateCompany);

// Protected routes (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteCompany);

module.exports = router;
