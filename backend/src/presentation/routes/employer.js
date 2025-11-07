const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getProfile,
  updateProfile,
  getCompany: getEmployerCompany,
  updateCompany: updateEmployerCompany,
  uploadLogo,
  uploadCoverImage,
  getEmployerStats,
  getDashboard,
} = require('../controllers/employerController');

const {
  createCompany,
  getCompany,
  updateCompany,
  getCompanyMembers,
  inviteMember,
  updateMemberPermissions,
  removeMember,
} = require('../controllers/companyController');

const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  updateDocumentMetadata,
  verifyDocument,
} = require('../controllers/documentController');

const {
  acceptInvitation,
  rejectInvitation,
  getMyInvitations,
  getInvitationByToken,
  cancelInvitation,
} = require('../controllers/invitationController');

const {
  uploadDocument: uploadMiddleware,
  uploadLogo: uploadLogoMiddleware,
  uploadCoverImage: uploadCoverImageMiddleware,
  uploadAvatar,
  uploadProfileCoverImage,
} = require('../middlewares/upload');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('employer'));

// Profile routes
router.route('/profile').get(getProfile).patch(updateProfile);

router.route('/profile/upload-avatar').post(uploadAvatar, uploadAvatar);

router
  .route('/profile/upload-cover-image')
  .post(uploadProfileCoverImage, uploadProfileCoverImage);

// Company routes
router
  .route('/company')
  .post(createCompany)
  .get(getCompany)
  .patch(updateCompany);

router.route('/company/upload-logo').post(uploadLogoMiddleware, uploadLogo);

router
  .route('/company/upload-cover-image')
  .post(uploadCoverImageMiddleware, uploadCoverImage);

router.route('/company/members').get(getCompanyMembers);

router.route('/company/members/invite').post(inviteMember);

router
  .route('/company/members/:memberId')
  .patch(updateMemberPermissions)
  .delete(removeMember);

// Invitation routes
router.route('/invitations').get(getMyInvitations);

router.route('/invitations/accept/:token').post(acceptInvitation);

router.route('/invitations/reject/:token').post(rejectInvitation);

router.route('/invitations/:invitationId').delete(cancelInvitation);

// Public route for invitation preview (before login)
router.route('/invitations/preview/:token').get(getInvitationByToken);

// Stats and dashboard routes
router.route('/stats').get(getEmployerStats);

router.route('/dashboard').get(getDashboard);

// Document verification routes
router
  .route('/documents')
  .get(getDocuments)
  .post(uploadMiddleware, uploadDocument);

// Individual document operations
router
  .route('/documents/:documentId')
  .get(getDocumentById)
  .put(uploadMiddleware, updateDocument)
  .delete(deleteDocument);

// Document metadata operations
router.route('/documents/:documentId/metadata').put(updateDocumentMetadata);

// Document verification status
router.route('/documents/:documentId/verify').put(verifyDocument);

module.exports = router;
