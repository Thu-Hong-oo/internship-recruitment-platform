const express = require('express');
const multer = require('multer');
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
  debugToken, // Add debug function
  compareProfiles, // Add compare function
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

// Profile routes
router.get('/profile', protect, getUserProfile);
router.get('/debug-token', protect, debugToken); // Debug endpoint
router.get('/compare-profiles', protect, compareProfiles); // Compare endpoint
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/password', protect, changePassword);

// Account management
router.post('/link-google', protect, linkGoogleAccount);
router.delete('/unlink-google', protect, unlinkGoogleAccount);
router.put('/preferences', protect, updateUserPreferences);
router.put('/deactivate', protect, deactivateAccount);
router.put('/reactivate', protect, reactivateAccount);

// User info
router.get('/stats', protect, getUserStats);
router.get('/notifications', protect, getUserNotifications); // Đúng cho notifications
router.get('/:id', protect, getUser); // Đặt sau /notifications để không bị Express nhầm lẫn
router.get(
  '/:id/public-profile',
  protect,
  authorize('employer'),
  getPublicUserProfile
);

// Notifications
router.get('/notifications', protect, getUserNotifications);
// Removed the :id from notifications
router.put('/notifications/read-all', protect, markAllNotificationsAsRead);
router.put('/notifications/read', protect, markNotificationAsRead); // Changed to not use :id
router.delete('/notifications', protect, deleteNotification); // Changed to not use :id

module.exports = router;
