const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getSystemDashboard,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  getSystemLogs,
  getSystemHealth,
  getQueueStatus,
  clearQueue,
  getSystemSettings,
  updateSystemSettings,
  sendSystemNotification,
  getSystemReports,
  verifyEmployerDocument,
} = require('../controllers/adminController');

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard routes
router.route('/dashboard').get(getSystemDashboard);

// User management routes
router.route('/users').get(getAllUsers);

router.route('/users/:id').get(getUserById).delete(deleteUser);

router.route('/users/:id/status').patch(updateUserStatus); // Changed from PUT to PATCH - partial update of user status

// System routes
router.route('/stats').get(getSystemStats);

router.route('/logs').get(getSystemLogs);

router.route('/health').get(getSystemHealth);

router.route('/queues').get(getQueueStatus);

router.route('/queues/:queueName').delete(clearQueue);

router.route('/settings').get(getSystemSettings).patch(updateSystemSettings); // Changed from PUT to PATCH - partial update of settings

router.route('/notifications').post(sendSystemNotification);

router.route('/reports').get(getSystemReports);

// Document verification routes
router
  .route('/employers/:employerId/documents/:documentId/verify')
  .put(verifyEmployerDocument);

module.exports = router;
