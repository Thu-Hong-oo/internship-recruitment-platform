const EmailIssue = require('../models/EmailIssue');
const { logger } = require('../utils/logger');

class EmailIssueService {
  /**
   * Log an email issue to database
   * @param {Object} data - Issue data
   * @param {string} data.userId - User ID
   * @param {string} data.email - Email address
   * @param {string} data.issueType - Type of issue
   * @param {string} data.errorMessage - Error message
   * @param {string} data.operation - Operation that failed
   * @param {string} data.errorCode - Error code (optional)
   * @param {string} data.responseCode - Response code (optional)
   */
  static async logIssue(data) {
    try {
      const issue = await EmailIssue.createIssue({
        userId: data.userId || null, // Allow null userId
        email: data.email,
        issueType: data.issueType,
        errorMessage: data.errorMessage,
        errorCode: data.errorCode,
        responseCode: data.responseCode,
        operation: data.operation,
      });

      logger.info('Email issue logged to database', {
        issueId: issue._id,
        userId: data.userId,
        email: data.email,
        issueType: data.issueType,
        operation: data.operation,
      });

      return issue;
    } catch (error) {
      logger.error('Failed to log email issue to database', {
        error: error.message,
        data: data,
      });
      throw error;
    }
  }

  /**
   * Get unresolved email issues
   * @param {number} limit - Number of issues to return
   * @returns {Array} Array of unresolved issues
   */
  static async getUnresolvedIssues(limit = 50) {
    try {
      return await EmailIssue.getUnresolvedIssues(limit);
    } catch (error) {
      logger.error('Failed to get unresolved email issues', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get issues by email address
   * @param {string} email - Email address
   * @returns {Array} Array of issues for the email
   */
  static async getIssuesByEmail(email) {
    try {
      return await EmailIssue.getIssuesByEmail(email);
    } catch (error) {
      logger.error('Failed to get issues by email', {
        error: error.message,
        email: email,
      });
      throw error;
    }
  }

  /**
   * Resolve an email issue
   * @param {string} issueId - Issue ID
   * @param {string} resolvedBy - Admin user ID who resolved it
   * @param {string} notes - Resolution notes
   */
  static async resolveIssue(issueId, resolvedBy, notes = '') {
    try {
      const issue = await EmailIssue.findByIdAndUpdate(
        issueId,
        {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: resolvedBy,
          notes: notes,
        },
        { new: true }
      );

      if (!issue) {
        throw new Error('Email issue not found');
      }

      logger.info('Email issue resolved', {
        issueId: issueId,
        resolvedBy: resolvedBy,
        email: issue.email,
      });

      return issue;
    } catch (error) {
      logger.error('Failed to resolve email issue', {
        error: error.message,
        issueId: issueId,
        resolvedBy: resolvedBy,
      });
      throw error;
    }
  }

  /**
   * Get email issue statistics
   * @returns {Object} Statistics about email issues
   */
  static async getStatistics() {
    try {
      const stats = await EmailIssue.aggregate([
        {
          $group: {
            _id: '$issueType',
            count: { $sum: 1 },
            resolved: { $sum: { $cond: ['$resolved', 1, 0] } },
            unresolved: { $sum: { $cond: ['$resolved', 0, 1] } },
          },
        },
      ]);

      const totalIssues = await EmailIssue.countDocuments();
      const unresolvedIssues = await EmailIssue.countDocuments({ resolved: false });

      return {
        totalIssues,
        unresolvedIssues,
        byType: stats,
      };
    } catch (error) {
      logger.error('Failed to get email issue statistics', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = EmailIssueService;
