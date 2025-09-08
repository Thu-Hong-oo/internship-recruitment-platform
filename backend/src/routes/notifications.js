const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUserNotifications,
  getNotification,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  broadcastNotification
} = require('../controllers/notificationController');

const router = express.Router();

// Protected routes for all users
router.get('/', protect, getUserNotifications);
router.get('/preferences', protect, getNotificationPreferences);
router.get('/:id', protect, getNotification);
router.post('/', protect, createNotification);
router.put('/preferences', protect, updateNotificationPreferences);
router.put('/:id/read', protect, markNotificationAsRead);
router.put('/read-all', protect, markAllNotificationsAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/', protect, deleteAllNotifications);

// Protected routes for admin
router.post('/broadcast', protect, authorize('admin'), broadcastNotification);

module.exports = router;
