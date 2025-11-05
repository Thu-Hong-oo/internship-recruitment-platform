const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const NotificationService = require('../../infrastructure/services/internal/NotificationService');
const NotificationResponseDTO = require('../dtos/NotificationResponseDTO');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.getUserNotifications(
      req.user.id,
      req.query
    );

    res.status(200).json({
      success: true,
      data: NotificationResponseDTO.fromNotifications(result.notifications).map(
        dto => dto.toJSON()
      ),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get user notifications error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.getNotificationById(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: NotificationResponseDTO.fromNotification(
        result.notification
      ).toJSON(),
    });
  } catch (error) {
    logger.error('Get notification by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.markNotificationAsRead(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: NotificationResponseDTO.fromNotification(
        result.notification
      ).toJSON(),
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.markAllNotificationsAsRead(
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.deleteNotification(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.getUnreadNotificationCount(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    logger.error('Get unread notification count error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create notification (Admin/System)
// @route   POST /api/notifications
// @access  Private (Admin)
const createNotification = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.createNotification(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: NotificationResponseDTO.fromNotification(
        result.notification
      ).toJSON(),
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
const getNotificationSettings = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.getNotificationSettings(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: result.settings,
    });
  } catch (error) {
    logger.error('Get notification settings error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.updateNotificationSettings(
      req.user.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.settings,
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get notification stats
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = asyncHandler(async (req, res) => {
  try {
    const result = await NotificationService.getNotificationStats(req.user.id);

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
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
};
