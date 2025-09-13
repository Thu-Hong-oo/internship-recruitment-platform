const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const { validateFileUpload } = require('../middleware/fileValidation');
const {
  verificationRateLimit,
  emailRateLimit,
} = require('../middleware/globalRateLimit');
const {
  getProfile,
  updateProfile,
  submitVerification,
  getVerificationStatus,
  getDocumentTypes,
  updateBusinessInfo,
  verifyCompanyEmail,
  resendVerificationEmail,
  getPostedJobs,
  getApplications,
  getAnalytics,
  updateCompanyInfo,
  getCompanyReviews,
  respondToReview,
  getDashboardStats,
  updatePreferences,
  getRecommendedCandidates,
  uploadCompanyLogo,
} = require('../controllers/employerProfileController');

const router = express.Router();

// ========================================
// EMPLOYER PROFILE ROUTES
// ========================================
// All routes are protected for employers only

// Profile & Verification
router.get('/profile', protect, authorize('employer'), getProfile);
router.put('/profile', protect, authorize('employer'), updateProfile);
router.post(
  '/upload-logo',
  protect,
  authorize('employer'),
  uploadLogo,
  validateFileUpload({
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  }),
  uploadCompanyLogo
);
router.post(
  '/verify',
  protect,
  authorize('employer'),
  verificationRateLimit,
  submitVerification
);
router.get(
  '/verification-status',
  //    Kiểm tra tiến độ xác thực
  // Xem hồ sơ đã được duyệt chưa
  // Kiểm tra bước nào còn thiếu
  // Theo dõi tiến độ verification
  protect,
  authorize('employer'),
  getVerificationStatus
);
router.get('/document-types', protect, authorize('employer'), getDocumentTypes);
router.post(
  '/verify-company-email',
  protect,
  authorize('employer'),
  emailRateLimit,
  verifyCompanyEmail
);
router.post(
  '/resend-verification-email',
  protect,
  authorize('employer'),
  emailRateLimit,
  resendVerificationEmail
);
router.put(
  '/verification/business-info',
  protect,
  authorize('employer'),
  verificationRateLimit,
  updateBusinessInfo
);

// Jobs & Applications
router.get('/jobs', protect, authorize('employer'), getPostedJobs);
router.get('/applications', protect, authorize('employer'), getApplications);
router.get(
  '/recommended-candidates',
  protect,
  authorize('employer'),
  getRecommendedCandidates
);

// Company Management
router.put('/company', protect, authorize('employer'), updateCompanyInfo);
router.get(
  '/company/reviews',
  protect,
  authorize('employer'),
  getCompanyReviews
);
router.post(
  '/company/reviews/:reviewId/respond',
  protect,
  authorize('employer'),
  respondToReview
);

// Analytics & Dashboard
router.get('/analytics', protect, authorize('employer'), getAnalytics);
router.get('/dashboard', protect, authorize('employer'), getDashboardStats);
router.put('/preferences', protect, authorize('employer'), updatePreferences);

module.exports = router;
