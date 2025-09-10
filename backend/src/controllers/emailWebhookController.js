const User = require('../models/User');
const EmailIssueService = require('../services/emailIssueService');
const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');

/**
 * Handle email bounce-back webhook
 * Called when email service reports a bounce-back
 */
const handleEmailBounce = asyncHandler(async (req, res) => {
  const { email, reason, timestamp, messageId } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user email status
    user.emailStatus = 'bounced';
    user.emailBounceAt = new Date();
    user.emailBounceReason = reason || 'Unknown bounce reason';
    await user.save();

    // Log the issue
    await EmailIssueService.logIssue({
      userId: user._id,
      email: email.toLowerCase(),
      issueType: 'BOUNCE_BACK',
      errorMessage: reason || 'Email bounced back',
      operation: 'REGISTER',
      resolved: false
    });

    logger.info('Email bounce processed', {
      email: email.toLowerCase(),
      userId: user._id,
      reason,
      messageId,
      service: 'internship-ai-platform',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Bounce-back processed successfully',
      userId: user._id
    });

  } catch (error) {
    logger.error('Error processing email bounce', {
      error: error.message,
      email,
      service: 'internship-ai-platform',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process bounce-back'
    });
  }
});

/**
 * Handle email delivery confirmation webhook
 * Called when email is successfully delivered
 */
const handleEmailDelivery = asyncHandler(async (req, res) => {
  const { email, timestamp, messageId } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user email status
    user.emailStatus = 'delivered';
    user.emailDeliveredAt = new Date();
    await user.save();

    logger.info('Email delivery confirmed', {
      email: email.toLowerCase(),
      userId: user._id,
      messageId,
      service: 'internship-ai-platform',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Email delivery confirmed',
      userId: user._id
    });

  } catch (error) {
    logger.error('Error processing email delivery', {
      error: error.message,
      email,
      service: 'internship-ai-platform',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process delivery confirmation'
    });
  }
});

/**
 * Validate email manually (for frontend use)
 * Check if email has recent bounce issues
 */
const validateEmailManually = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for recent email issues
    const recentIssues = await EmailIssueService.getIssuesByEmail(email.toLowerCase());
    const recentBounceIssues = recentIssues.filter(issue => 
      issue.issueType === 'BOUNCE_BACK' && 
      !issue.resolved &&
      new Date(issue.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    const isEmailValid = recentBounceIssues.length === 0;

    res.json({
      success: true,
      data: {
        email: email.toLowerCase(),
        userId: user._id,
        emailStatus: user.emailStatus || 'unknown',
        recentIssues: recentIssues.length,
        lastIssue: recentIssues.length > 0 ? recentIssues[0].createdAt : null,
        isEmailValid
      }
    });

  } catch (error) {
    logger.error('Error validating email', {
      error: error.message,
      email,
      service: 'internship-ai-platform',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate email'
    });
  }
});

module.exports = {
  handleEmailBounce,
  handleEmailDelivery,
  validateEmailManually
};
