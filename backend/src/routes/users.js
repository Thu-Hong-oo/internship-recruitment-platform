const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUser,
  getUserProfile,
  getPublicUserProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  linkGoogleAccount,
  unlinkGoogleAccount,
  getUserStats,
  updateUserPreferences,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deactivateAccount,
  reactivateAccount,
} = require('../controllers/userController');

const {
  uploadAvatar: uploadAvatarMiddleware,
} = require('../middleware/upload');

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, uploadAvatarMiddleware, uploadAvatar);
router.put('/password', protect, changePassword);

// Account management
router.post('/link-google', protect, linkGoogleAccount);
router.delete('/unlink-google', protect, unlinkGoogleAccount);
router.put('/preferences', protect, updateUserPreferences);
router.put('/deactivate', protect, deactivateAccount);
router.put('/reactivate', protect, reactivateAccount);

// User info
router.get('/stats', protect, getUserStats);
router.get('/:id', protect, getUser);
router.get(
  '/:id/public-profile',
  protect,
  authorize('employer'),
  getPublicUserProfile
);

// Notifications
router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/:id/read', protect, markNotificationAsRead);
router.put('/notifications/read-all', protect, markAllNotificationsAsRead);
router.delete('/notifications/:id', protect, deleteNotification);

module.exports = router;
