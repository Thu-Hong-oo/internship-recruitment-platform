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

router.route('/conversations/:id/archive').put(archiveConversation);

router.route('/conversations/:id/unarchive').put(unarchiveConversation);

router.route('/conversations/:id/read').put(markMessagesAsRead);

// Message routes
router
  .route('/conversations/:id/messages')
  .post(sendMessage)
  .get(getConversationMessages);

router.route('/messages/:id').put(editMessage).delete(deleteMessage);

// Stats routes
router.route('/unread-count').get(getUnreadMessageCount);

module.exports = router;
