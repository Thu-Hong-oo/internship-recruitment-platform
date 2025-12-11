const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  requireVerifiedEmployer,
} = require('../middleware/employerVerification');
const {
  updateApplicationStatus,
  getEmployerApplications,
} = require('../controllers/applicationController');

const router = express.Router();

// @route   PUT /api/applications/:id/status
// @desc    Update application status (for employers)
// @access  Private (Employer)
router.put(
  '/:id/status',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  updateApplicationStatus
);

// @route   GET /api/applications/employer
// @desc    Get applications for employer's jobs
// @access  Private (Employer)
router.get(
  '/employer',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  getEmployerApplications
);

module.exports = router;
