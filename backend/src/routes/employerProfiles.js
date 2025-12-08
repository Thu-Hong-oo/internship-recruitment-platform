const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const {
  requireEmployerProfile,
  requireVerifiedEmployer,
  ensureEmployerProfile,
} = require('../middleware/employerVerification');
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
  getProfileCompletion,
} = require('../controllers/employerProfileController');

const {
  inviteMember,
  getInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  updateMember,
  removeMember,
  verifyInvitationToken,
  getMyMembership,
} = require('../controllers/teamInvitationController');

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
// All routes require employer authentication and profile existence

// Profile & Verification (basic profile required)
router.get(
  '/profile',
  protect,
  authorize('employer'),
  ensureEmployerProfile,
  getProfile
);
router.get(
  '/profile-completion',
  protect,
  authorize('employer'),
  ensureEmployerProfile,
  getProfileCompletion
);
router.get(
  '/company',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  getCompanyInfo
);
router.put(
  '/profile',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  updateProfile
);

// Image Management (basic profile required)
router.post(
  '/upload-logo',
  protect,
  authorize('employer'),
  requireEmployerProfile,
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
  requireEmployerProfile,
  uploadImage.single('coverImage'),
  validateFileUpload({
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  }),
  uploadCoverImage
);

router.delete(
  '/logo',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  removeLogo
);
router.delete(
  '/cover-image',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  removeCoverImage
);

// Verification (basic profile required)
router.get(
  '/verification-status',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  getVerificationStatus
);
router.get(
  '/document-types',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  getDocumentTypes
);
// Document uploads (basic profile required)
router.post(
  '/documents/business-license',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  uploadDocument.single('document'),
  uploadBusinessLicense
);

router.post(
  '/documents/tax-certificate',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  uploadDocument.single('document'),
  uploadTaxCertificate
);

router.delete(
  '/documents/:documentId',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  removeDocument
);

// Jobs & Applications (verification required for sensitive operations)
router.get(
  '/jobs',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  getPostedJobs
);
router.get(
  '/applications',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  getApplications
);
router.get(
  '/recommended-candidates',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  getRecommendedCandidates
);

// Company Management (basic profile required)
router.put(
  '/company',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  updateCompanyInfo
);

// Analytics & Dashboard (verification required)
router.get(
  '/analytics',
  protect,
  authorize('employer'),
  requireVerifiedEmployer,
  getAnalytics
);
// DEPRECATED: getDashboardStats merged into getAnalytics
// router.get('/dashboard', protect, authorize('employer'), getDashboardStats);
// DEPRECATED: updatePreferences not supported in schema
// router.put('/preferences', protect, authorize('employer'), updatePreferences);

// ============================================
// TEAM INVITATION ROUTES
// ============================================

// Invite team member
router.post(
  '/team/invite',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  inviteMember
);

// Get all invitations
router.get(
  '/team/invitations',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  getInvitations
);

// Verify invitation token (public - no auth required)
router.get(
  '/team/invitations/verify/:token',
  verifyInvitationToken
);

// Get current user membership info
router.get(
  '/team/me',
  protect,
  authorize('employer'),
  getMyMembership
);

// Accept invitation (public - token in body)
// Support both with invitationId and without (token-only)
router.post(
  '/team/invitations/:invitationId?/accept',
  acceptInvitation
);

// Reject invitation (public - token in body)
router.post(
  '/team/invitations/:invitationId/reject',
  rejectInvitation
);

// Cancel invitation (owner/admin only)
router.delete(
  '/team/invitations/:invitationId',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  cancelInvitation
);

// Update member (role, permissions, status)
router.put(
  '/team/members/:memberId',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  updateMember
);

// Remove member from team
router.delete(
  '/team/members/:memberId',
  protect,
  authorize('employer'),
  requireEmployerProfile,
  removeMember
);

module.exports = router;
