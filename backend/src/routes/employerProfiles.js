const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const { validateFileUpload } = require('../middleware/fileValidation');
const {
  verificationRateLimit,
  // emailRateLimit, // Không cần nữa vì email verification đã chuyển sang User model
} = require('../middleware/globalRateLimit');
const {
  getProfile,
  updateProfile,
  getCompanyInfo,
  getVerificationStatus,
  getDocumentTypes,
  uploadBusinessLicense,
  uploadTaxCertificate,
  removeDocument,
  updateCompanyInfo,
  getPostedJobs,
  getApplications,
  getAnalytics,
  getRecommendedCandidates,
  uploadCompanyLogo,
  uploadCoverImage,
  removeLogo,
  removeCoverImage,
} = require('../controllers/employerProfileController');

const router = express.Router();

// Configure multer for image uploads only
const uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Configure multer for document uploads (PDF + Images)
const uploadDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Allow PDFs and images for documents
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF hoặc hình ảnh'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for documents
  },
});

// ========================================
// EMPLOYER PROFILE ROUTES
// ========================================
// All routes are protected for employers only

// Profile & Verification
router.get('/profile', protect, authorize('employer'), getProfile);
router.get('/company', protect, authorize('employer'), getCompanyInfo);
router.put('/profile', protect, authorize('employer'), updateProfile);

// Image Management
router.post(
  '/upload-logo',
  protect,
  authorize('employer'),
  uploadImage.single('logo'),
  validateFileUpload({
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  }),
  uploadCompanyLogo
);

router.post(
  '/upload-cover-image',
  protect,
  authorize('employer'),
  uploadImage.single('coverImage'),
  validateFileUpload({
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  }),
  uploadCoverImage
);

router.delete('/logo', protect, authorize('employer'), removeLogo);
router.delete('/cover-image', protect, authorize('employer'), removeCoverImage);
// REMOVED: POST /verify endpoint - use specific document upload endpoints instead
// router.post('/verify', protect, authorize('employer'), verificationRateLimit, submitVerification);
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
// DEPRECATED: Generic document upload removed - use specific endpoints instead
// router.post('/documents', protect, authorize('employer'), uploadDocument.single('document'), addDocument);

// Specific document type uploads - Frontend chỉ cần upload file + metadata
router.post(
  '/documents/business-license',
  protect,
  authorize('employer'),
  uploadDocument.single('document'),
  uploadBusinessLicense
);

router.post(
  '/documents/tax-certificate',
  protect,
  authorize('employer'),
  uploadDocument.single('document'),
  uploadTaxCertificate
);

router.delete(
  '/documents/:documentId',
  protect,
  authorize('employer'),
  removeDocument
);
// DEPRECATED: Email verification moved to User model
// router.post('/verify-company-email', protect, authorize('employer'), emailRateLimit, verifyCompanyEmail);
// router.post('/resend-verification-email', protect, authorize('employer'), emailRateLimit, resendVerificationEmail);
// DEPRECATED: updateBusinessInfo merged into updateCompanyInfo
// router.put('/verification/business-info', protect, authorize('employer'), verificationRateLimit, updateBusinessInfo);

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

// Analytics & Dashboard (merged)
router.get('/analytics', protect, authorize('employer'), getAnalytics);
// DEPRECATED: getDashboardStats merged into getAnalytics
// router.get('/dashboard', protect, authorize('employer'), getDashboardStats);
// DEPRECATED: updatePreferences not supported in schema
// router.put('/preferences', protect, authorize('employer'), updatePreferences);

module.exports = router;
