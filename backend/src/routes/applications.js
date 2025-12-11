const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  requireVerifiedEmployer,
} = require('../middleware/employerVerification');
const {
  updateApplicationStatus,
  getEmployerApplications,
  scheduleInterview,
  updateInterview,
  cancelInterview,
  getEmployerInterviews,
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

// @route   POST /api/applications/:id/interviews
// @desc    Schedule interview
// @access  Private (Employer)
router.post(
  '/:id/interviews',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  scheduleInterview
);

// @route   PUT /api/applications/:id/interviews/:interviewId
// @desc    Update interview
// @access  Private (Employer)
router.put(
  '/:id/interviews/:interviewId',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  updateInterview
);

// @route   DELETE /api/applications/:id/interviews/:interviewId
// @desc    Cancel interview
// @access  Private (Employer)
router.delete(
  '/:id/interviews/:interviewId',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  cancelInterview
);

// @route   GET /api/applications/interviews/employer
// @desc    Get upcoming interviews for employer
// @access  Private (Employer)
router.get(
  '/interviews/employer',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  getEmployerInterviews
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
