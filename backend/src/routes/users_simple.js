const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  updateUserPreferences,
} = require('../controllers/userController_simple');

const {
  uploadAvatar: uploadAvatarMiddleware,
} = require('../middleware/upload');

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, uploadAvatarMiddleware, uploadAvatar);
router.put('/password', protect, changePassword);
router.put('/preferences', protect, updateUserPreferences);

module.exports = router;
