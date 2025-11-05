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

router.route('/:id/read').patch(markNotificationAsRead); // PATCH for marking read

router.route('/read-all').patch(markAllNotificationsAsRead); // PATCH for bulk status change

// Settings routes
router
  .route('/settings')
  .get(getNotificationSettings)
  .patch(updateNotificationSettings); // PATCH for partial settings update

// Stats routes
router.route('/unread-count').get(getUnreadNotificationCount);

router.route('/stats').get(getNotificationStats);

module.exports = router;
