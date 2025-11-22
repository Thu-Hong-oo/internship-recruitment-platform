const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUser,
  getPublicUserProfile,
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

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Avatar & Password
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/password', protect, changePassword);

// Account management
router.post('/link-google', protect, linkGoogleAccount);
router.delete('/unlink-google', protect, unlinkGoogleAccount);
router.put('/preferences', protect, updateUserPreferences);
router.put('/deactivate', protect, deactivateAccount);
router.put('/reactivate', protect, reactivateAccount);

// User info & stats
router.get('/stats', protect, getUserStats);

// Notifications (must be before /:id routes to avoid conflicts)
router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsAsRead);
router.put('/notifications/:id/read', protect, markNotificationAsRead);
router.delete('/notifications/:id', protect, deleteNotification);

// User by ID (must be last to avoid route conflicts)
router.get('/:id', protect, getUser);
router.get(
  '/:id/public-profile',
  protect,
  authorize('employer'),
  getPublicUserProfile
);

module.exports = router;
