const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const ChatService = require('../../infrastructure/services/internal/ChatService');

// @desc    Create conversation
// @route   POST /api/chat/conversations
// @access  Private
const createConversation = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.createConversation(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.conversation,
    });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get user conversations
// @route   GET /api/chat/conversations
// @access  Private
const getUserConversations = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.getUserConversations(
      req.user.id,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.conversations,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get user conversations error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get conversation by ID
// @route   GET /api/chat/conversations/:id
// @access  Private
const getConversationById = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.getConversationById(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: result.conversation,
    });
  } catch (error) {
    logger.error('Get conversation by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Send message
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.sendMessage(
      req.params.id,
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.message,
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get conversation messages
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getConversationMessages = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.getConversationMessages(
      req.params.id,
      req.user.id,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.messages,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get conversation messages error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Mark messages as read
// @route   PUT /api/chat/conversations/:id/read
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.markMessagesAsRead(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Mark messages as read error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete message
// @route   DELETE /api/chat/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.deleteMessage(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Edit message
// @route   PUT /api/chat/messages/:id
// @access  Private
const editMessage = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.editMessage(
      req.params.id,
      req.user.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.message,
    });
  } catch (error) {
    logger.error('Edit message error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadMessageCount = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.getUnreadMessageCount(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    logger.error('Get unread message count error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Archive conversation
// @route   PUT /api/chat/conversations/:id/archive
// @access  Private
const archiveConversation = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.archiveConversation(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.conversation,
    });
  } catch (error) {
    logger.error('Archive conversation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Unarchive conversation
// @route   PUT /api/chat/conversations/:id/unarchive
// @access  Private
const unarchiveConversation = asyncHandler(async (req, res) => {
  try {
    const result = await ChatService.unarchiveConversation(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.conversation,
    });
  } catch (error) {
    logger.error('Unarchive conversation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
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
};
