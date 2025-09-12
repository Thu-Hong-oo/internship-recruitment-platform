const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  submitVerification,
  getVerificationStatus,
  getPostedJobs,
  getApplications,
  getAnalytics,
  updateCompanyInfo,
  getCompanyReviews,
  respondToReview,
  getDashboardStats,
  updatePreferences,
  getRecommendedCandidates
} = require('../controllers/employerProfileController');

const router = express.Router();

// ========================================
// EMPLOYER PROFILE ROUTES
// ========================================
// All routes are protected for employers only

// Profile & Verification
router.get('/profile', protect, authorize('employer'), getProfile);
router.put('/profile', protect, authorize('employer'), updateProfile);
router.post('/verify', protect, authorize('employer'), submitVerification);
router.get('/verification-status', protect, authorize('employer'), getVerificationStatus);

// Jobs & Applications
router.get('/jobs', protect, authorize('employer'), getPostedJobs);
router.get('/applications', protect, authorize('employer'), getApplications);
router.get('/recommended-candidates', protect, authorize('employer'), getRecommendedCandidates);

// Company Management
router.put('/company', protect, authorize('employer'), updateCompanyInfo);
router.get('/company/reviews', protect, authorize('employer'), getCompanyReviews);
router.post('/company/reviews/:reviewId/respond', protect, authorize('employer'), respondToReview);

// Analytics & Dashboard
router.get('/analytics', protect, authorize('employer'), getAnalytics);
router.get('/dashboard', protect, authorize('employer'), getDashboardStats);
router.put('/preferences', protect, authorize('employer'), updatePreferences);

module.exports = router;
