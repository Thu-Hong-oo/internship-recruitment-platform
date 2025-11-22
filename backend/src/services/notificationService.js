const Notification = require('../models/Notification');
const { getIO } = require('../socket');
const { logger } = require('../utils/logger');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_CHANNELS,
} = require('../constants/common.constants');

/**
 * Notification Service
 * Tự động tạo notification và gửi realtime qua Socket.io
 */
class NotificationService {
  /**
   * Tạo notification và emit realtime
   * @param {Object} options - Notification options
   * @param {String} options.recipientId - User ID nhận notification
   * @param {String} options.senderId - User ID gửi notification (optional)
   * @param {String} options.type - Notification type (NOTIFICATION_TYPES)
   * @param {String} options.title - Notification title
   * @param {String} options.message - Notification message
   * @param {Object} options.data - Additional data (jobId, applicationId, etc.)
   * @param {String} options.priority - Notification priority (default: LOW)
   * @param {String} options.channel - Notification channel (default: IN_APP)
   * @returns {Promise<Notification>}
   */
  static async createAndSend({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    data = {},
    priority = NOTIFICATION_PRIORITY.LOW,
    channel = NOTIFICATION_CHANNELS.IN_APP,
  }) {
    try {
      // Tạo notification trong DB
      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        data,
        priority,
        channel,
        isRead: false,
        isSent: false,
        sentAt: new Date(),
      });

      // Emit realtime qua Socket.io
      try {
        const io = getIO();
        io.to(`user:${recipientId}`).emit('new-notification', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
        });

        // Update isSent
        notification.isSent = true;
        notification.deliveredAt = new Date();
        await notification.save();

        logger.info('Notification created and sent via socket', {
          notificationId: notification._id,
          recipientId,
          type,
        });
      } catch (socketError) {
        logger.error('Failed to emit notification via socket', {
          error: socketError.message,
          notificationId: notification._id,
        });
        // Vẫn lưu notification dù socket fail
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification', {
        error: error.message,
        recipientId,
        type,
      });
      throw error;
    }
  }

  /**
   * Notify employer khi có application mới
   * @param {String} employerId - Employer user ID
   * @param {String} applicationId - Application ID
   * @param {String} jobId - Job ID
   * @param {String} candidateName - Candidate name
   */
  static async notifyNewApplication(employerId, applicationId, jobId, candidateName) {
    return this.createAndSend({
      recipientId: employerId,
      type: NOTIFICATION_TYPES.NEW_APPLICATION,
      title: 'Ứng viên mới ứng tuyển',
      message: `${candidateName} đã ứng tuyển vào công việc của bạn`,
      data: {
        applicationId,
        jobId,
      },
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });
  }

  /**
   * Notify candidate khi application status thay đổi
   * @param {String} candidateId - Candidate user ID
   * @param {String} applicationId - Application ID
   * @param {String} jobId - Job ID
   * @param {String} jobTitle - Job title
   * @param {String} status - New status
   */
  static async notifyApplicationStatusChange(
    candidateId,
    applicationId,
    jobId,
    jobTitle,
    status
  ) {
    const statusMessages = {
      reviewing: 'Đơn ứng tuyển của bạn đang được xem xét',
      shortlisted: 'Chúc mừng! Bạn đã được chọn vào danh sách ứng viên tiềm năng',
      interview: 'Bạn đã được mời phỏng vấn',
      offer: 'Chúc mừng! Bạn đã nhận được lời mời làm việc',
      accepted: 'Đơn ứng tuyển của bạn đã được chấp nhận',
      rejected: 'Rất tiếc, đơn ứng tuyển của bạn đã bị từ chối',
    };

    return this.createAndSend({
      recipientId: candidateId,
      type: NOTIFICATION_TYPES.APPLICATION_STATUS,
      title: 'Cập nhật trạng thái đơn ứng tuyển',
      message: statusMessages[status] || `Trạng thái đơn ứng tuyển đã thay đổi: ${status}`,
      data: {
        applicationId,
        jobId,
        status,
      },
      priority: status === 'rejected' ? NOTIFICATION_PRIORITY.LOW : NOTIFICATION_PRIORITY.MEDIUM,
    });
  }

  /**
   * Notify khi interview được schedule
   * @param {String} recipientId - User ID (candidate hoặc employer)
   * @param {String} applicationId - Application ID
   * @param {String} jobId - Job ID
   * @param {Date} interviewTime - Interview time
   * @param {String} role - 'candidate' hoặc 'employer'
   */
  static async notifyInterviewScheduled(
    recipientId,
    applicationId,
    jobId,
    interviewTime,
    role = 'candidate'
  ) {
    const title =
      role === 'candidate'
        ? 'Bạn đã được mời phỏng vấn'
        : 'Lịch phỏng vấn đã được đặt';
    const message =
      role === 'candidate'
        ? `Bạn có một buổi phỏng vấn được lên lịch vào ${interviewTime.toLocaleString('vi-VN')}`
        : `Lịch phỏng vấn đã được đặt vào ${interviewTime.toLocaleString('vi-VN')}`;

    return this.createAndSend({
      recipientId,
      type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
      title,
      message,
      data: {
        applicationId,
        jobId,
        interviewTime,
      },
      priority: NOTIFICATION_PRIORITY.HIGH,
    });
  }

  /**
   * Notify candidate về job match (job recommendation)
   * @param {String} candidateId - Candidate user ID
   * @param {String} jobId - Job ID
   * @param {String} jobTitle - Job title
   * @param {Number} matchScore - Match score (0-100)
   */
  static async notifyJobMatch(candidateId, jobId, jobTitle, matchScore) {
    return this.createAndSend({
      recipientId: candidateId,
      type: NOTIFICATION_TYPES.JOB_MATCH,
      title: 'Công việc phù hợp với bạn',
      message: `Có một công việc "${jobTitle}" phù hợp ${matchScore}% với hồ sơ của bạn`,
      data: {
        jobId,
        matchScore,
      },
      priority: NOTIFICATION_PRIORITY.LOW,
    });
  }

  /**
   * Notify system message
   * @param {String} recipientId - User ID
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   * @param {Object} data - Additional data
   */
  static async notifySystem(recipientId, title, message, data = {}) {
    return this.createAndSend({
      recipientId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      data,
      priority: NOTIFICATION_PRIORITY.LOW,
    });
  }

  /**
   * Mark notification as read và emit realtime
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (notification) {
      // Emit realtime update
      try {
        const io = getIO();
        io.to(`user:${userId}`).emit('notification_read', {
          notificationId: notification._id,
          readAt: notification.readAt,
        });
      } catch (error) {
        logger.error('Failed to emit notification_read via socket', {
          error: error.message,
        });
      }
    }

    return notification;
  }
}

module.exports = NotificationService;

