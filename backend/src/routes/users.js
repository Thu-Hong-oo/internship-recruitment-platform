const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUser,
  getUserProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  linkGoogleAccount,
  unlinkGoogleAccount,
  searchUsers,
  getUserStats,
  updateUserPreferences,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deactivateAccount,
  reactivateAccount,
} = require('../controllers/userController');

const { uploadMiddleware } = require('../middleware/upload');

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
// router.post(
//   '/upload-avatar',
//   protect,
//   uploadMiddleware.single('avatar'),
//   uploadAvatar
// );
router.put('/password', protect, changePassword);

// Account management
router.post('/link-google', protect, linkGoogleAccount);
router.delete('/unlink-google', protect, unlinkGoogleAccount);
router.put('/preferences', protect, updateUserPreferences);
router.put('/deactivate', protect, deactivateAccount);
router.put('/reactivate', protect, reactivateAccount);

// User search & info
router.get('/search', searchUsers);
router.get('/stats', protect, getUserStats);
router.get('/:id', protect, getUser);

// Notifications
router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/:id/read', protect, markNotificationAsRead);
router.put('/notifications/read-all', protect, markAllNotificationsAsRead);
router.delete('/notifications/:id', protect, deleteNotification);

module.exports = router;
