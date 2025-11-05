const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createConversation,
  getUserConversations,
  getConversationById,
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  getUnreadMessageCount,
  archiveConversation,
  unarchiveConversation,
} = require('../controllers/chatController');

// Apply authentication to all routes
router.use(protect);

// Conversation routes
router
  .route('/conversations')
  .post(createConversation)
  .get(getUserConversations);

router.route('/conversations/:id').get(getConversationById);

router.route('/conversations/:id/archive').patch(archiveConversation); // PATCH for status change

router.route('/conversations/:id/unarchive').patch(unarchiveConversation); // PATCH for status change

router.route('/conversations/:id/read').patch(markMessagesAsRead); // PATCH for marking read

// Message routes
router
  .route('/conversations/:id/messages')
  .post(sendMessage)
  .get(getConversationMessages);

router.route('/messages/:id').patch(editMessage).delete(deleteMessage); // PATCH for partial edit

// Stats routes
router.route('/unread-count').get(getUnreadMessageCount);

module.exports = router;
