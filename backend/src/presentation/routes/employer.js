const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getProfile,
  updateProfile,
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
  acceptInvitation,
  rejectInvitation,
  getMyInvitations,
  getInvitationByToken,
  cancelInvitation,
} = require('../controllers/invitationController');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('employer'));

// Profile routes
router.route('/profile').get(getProfile).patch(updateProfile);

// Company routes
router
  .route('/company')
  .post(createCompany)
  .get(getCompany)
  .patch(updateCompany);

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

module.exports = router;
