const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const { logger } = require('../utils/logger');

/**
 * Test endpoint để kiểm tra notification
 * GET /api/test/notifications/check
 */
router.get('/check', protect, async (req, res) => {
  try {
    // Kiểm tra notifications của user hiện tại
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const total = await Notification.countDocuments({ recipient: req.user.id });
    const unread = await Notification.countDocuments({ 
      recipient: req.user.id, 
      isRead: false 
    });
    
    res.json({
      success: true,
      userId: req.user.id,
      total,
      unread,
      recent: notifications,
    });
  } catch (error) {
    logger.error('Test notification check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Test endpoint để tạo notification thử
 * POST /api/test/notifications/create
 */
router.post('/create', protect, async (req, res) => {
  try {
    const notification = await NotificationService.createAndSend({
      recipientId: req.user.id,
      type: 'SYSTEM',
      title: 'Test Notification',
      message: 'Đây là notification test',
      data: { test: true },
      priority: 'medium',
    });
    
    res.json({
      success: true,
      notification,
      message: 'Test notification created',
    });
  } catch (error) {
    logger.error('Test notification create error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

