const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getEmployerProfile,
  createEmployerProfile,
  updateEmployerProfile,
  getEmployerDashboard,
  getProfileCompletion,
  deleteEmployerProfile
} = require('../controllers/employerProfileController');

const router = express.Router();

// ========================================
// EMPLOYER PROFILE ROUTES
// ========================================
// All routes are protected for employers only

// Profile management
router.get('/', protect, authorize('employer'), getEmployerProfile);
router.post('/', protect, authorize('employer'), createEmployerProfile);
router.put('/', protect, authorize('employer'), updateEmployerProfile);
router.delete('/', protect, authorize('employer'), deleteEmployerProfile);

// Dashboard & analytics
router.get('/dashboard', protect, authorize('employer'), getEmployerDashboard);
router.get('/completion', protect, authorize('employer'), getProfileCompletion);

// Company info route removed. Use /api/companies/me instead.

module.exports = router;
