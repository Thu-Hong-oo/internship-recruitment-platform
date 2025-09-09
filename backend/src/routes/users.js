const express = require('express');
const {
  protect,
  authorize,
} = require('../middleware/auth');
const { requireEmailVerification } = require('../middleware/emailVerification');
const {
  uploadAvatar: uploadAvatarMiddleware,
  handleUploadError,
} = require('../middleware/upload');
const { uploadRateLimit } = require('../middleware/globalRateLimit');
const {
  getUser,
  getUserProfile,
  uploadAvatar,
  updateProfile,
  changePassword,
  linkGoogleAccount,
  unlinkGoogleAccount,
  // Additional user functions
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


const router = express.Router();

// All routes require authentication
router.use(protect);

// ========================================
// USER MANAGEMENT ROUTES
// ========================================



/**
 * @swagger
 * /api/users/upload-avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (jpg, jpeg, png, gif, webp, max 10MB) - Uploads to Cloudinary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: No file selected or invalid file type
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Failed to update avatar in database
 */
router.post(
  '/upload-avatar',
  requireEmailVerification,
  uploadRateLimit,
  uploadAvatarMiddleware,
  handleUploadError,
  uploadAvatar
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               address:
 *                 type: object
 *               education:
 *                 type: object
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */
router.put('/profile', requireEmailVerification, updateProfile);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Current password incorrect
 */
router.put('/password', requireEmailVerification, changePassword);

/**
 * @swagger
 * /api/users/link-google:
 *   post:
 *     summary: Link Google account to existing user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Google account linked successfully
 *       400:
 *         description: Invalid token or account already linked
 */
router.post('/link-google', requireEmailVerification, linkGoogleAccount);

/**
 * @swagger
 * /api/users/unlink-google:
 *   delete:
 *     summary: Unlink Google account from user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google account unlinked successfully
 *       400:
 *         description: Cannot unlink if it's the only auth method
 */
router.delete('/unlink-google', requireEmailVerification, unlinkGoogleAccount);


// ========================================
// GENERAL USER ROUTES (must be last to avoid conflicts)
// ========================================

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */
router.get('/profile', getUserProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get single user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/:id', getUser);

// ========================================
// ADDITIONAL USER ROUTES
// ========================================

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/search', searchUsers);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/stats', getUserStats);

/**
 * @swagger
 * /api/users/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *               privacy:
 *                 type: object
 *               language:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *       401:
 *         description: Not authorized
 */
router.put('/preferences', updateUserPreferences);

/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/notifications', getUserNotifications);

/**
 * @swagger
 * /api/users/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Notification not found
 */
router.put('/notifications/:id/read', markNotificationAsRead);

/**
 * @swagger
 * /api/users/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Not authorized
 */
router.put('/notifications/read-all', markAllNotificationsAsRead);

/**
 * @swagger
 * /api/users/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Notification not found
 */
router.delete('/notifications/:id', deleteNotification);

/**
 * @swagger
 * /api/users/deactivate:
 *   put:
 *     summary: Deactivate user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for deactivation
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       401:
 *         description: Not authorized
 */
router.put('/deactivate', deactivateAccount);

/**
 * @swagger
 * /api/users/reactivate:
 *   put:
 *     summary: Reactivate user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account reactivated successfully
 *       401:
 *         description: Not authorized
 */
router.put('/reactivate', reactivateAccount);

module.exports = router;
