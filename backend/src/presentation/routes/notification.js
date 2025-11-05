const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  createNotification,
  getNotificationSettings,
  updateNotificationSettings,
  getNotificationStats,
} = require('../controllers/notificationController');

// Apply authentication to all routes
router.use(protect);

// Notification routes
router
  .route('/')
  .get(getUserNotifications)
  .post(authorize('admin'), createNotification);

router.route('/:id').get(getNotificationById).delete(deleteNotification);

router.route('/:id/read').put(markNotificationAsRead);

router.route('/read-all').put(markAllNotificationsAsRead);

// Settings routes
router
  .route('/settings')
  .get(getNotificationSettings)
  .put(updateNotificationSettings);

// Stats routes
router.route('/unread-count').get(getUnreadNotificationCount);

router.route('/stats').get(getNotificationStats);

module.exports = router;
