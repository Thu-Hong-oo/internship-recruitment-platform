const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getEmployerProfile,
  createEmployerProfile,
  updateEmployerProfile,
  updateCompanyInfo,
  getCompanyInfo,
  uploadCompanyLogo,
  getEmployerDashboard,
  getProfileCompletion,
  deleteEmployerProfile
} = require('../controllers/employerProfileController');

const router = express.Router();

// All routes are protected for employers only
router.get('/', protect, authorize('employer'), getEmployerProfile);
router.get('/company', protect, authorize('employer'), getCompanyInfo);
router.get('/dashboard', protect, authorize('employer'), getEmployerDashboard);
router.get('/completion', protect, authorize('employer'), getProfileCompletion);
router.post('/', protect, authorize('employer'), createEmployerProfile);
router.put('/', protect, authorize('employer'), updateEmployerProfile);
router.put('/company', protect, authorize('employer'), updateCompanyInfo);
router.post('/company/logo', protect, authorize('employer'), uploadCompanyLogo);
router.delete('/', protect, authorize('employer'), deleteEmployerProfile);

module.exports = router;
