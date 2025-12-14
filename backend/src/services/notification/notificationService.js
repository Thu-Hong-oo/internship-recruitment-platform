const Notification = require('../../models/Notification');
const { getIO } = require('../../socket');
const { logger } = require('../../utils/logger');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_CHANNELS,
} = require('../../constants/common.constants');

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
   * @param {String} candidateId - Candidate user ID (optional, để cập nhật notification sau này)
   */
  static async notifyNewApplication(employerId, applicationId, jobId, candidateName, candidateId = null) {
    return this.createAndSend({
      recipientId: employerId,
      type: NOTIFICATION_TYPES.NEW_APPLICATION,
      title: 'Có ứng viên mới ứng tuyển',
      message: `Ứng viên ${candidateName} vừa gửi đơn ứng tuyển. Vui lòng xem xét hồ sơ trong thời gian sớm nhất.`,
      data: {
        applicationId,
        jobId,
        candidateId: candidateId || null, // Lưu candidateId để có thể cập nhật sau
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
      pending: `Đơn ứng tuyển cho vị trí "${jobTitle}" đã được gửi thành công. Nhà tuyển dụng sẽ xem xét và phản hồi trong thời gian sớm nhất.`,
      reviewing: `Nhà tuyển dụng đang xem xét đơn ứng tuyển của bạn cho vị trí "${jobTitle}". Vui lòng chờ phản hồi.`,
      shortlisted: `Chúc mừng! Bạn đã được chọn vào danh sách ứng viên tiềm năng cho vị trí "${jobTitle}". Nhà tuyển dụng sẽ liên hệ với bạn sớm.`,
      interview: `Bạn đã được mời tham gia phỏng vấn cho vị trí "${jobTitle}". Vui lòng kiểm tra thông tin chi tiết và chuẩn bị tốt nhất.`,
      offer: `Chúc mừng! Bạn đã nhận được lời mời làm việc cho vị trí "${jobTitle}". Vui lòng xem xét và phản hồi lời mời trong thời gian sớm nhất.`,
      accepted: `Đơn ứng tuyển của bạn cho vị trí "${jobTitle}" đã được chấp nhận. Chúc mừng bạn đã có công việc mới!`,
      rejected: `Cảm ơn bạn đã quan tâm đến vị trí "${jobTitle}". Rất tiếc, đơn ứng tuyển của bạn không phù hợp với yêu cầu hiện tại. Chúc bạn may mắn với các cơ hội khác.`,
      withdrawn: `Đơn ứng tuyển của bạn cho vị trí "${jobTitle}" đã được rút lại thành công.`,
    };

    const statusTitles = {
      pending: 'Đơn ứng tuyển đã được gửi',
      reviewing: 'Đơn ứng tuyển đang được xem xét',
      shortlisted: 'Bạn đã được chọn vào danh sách ứng viên tiềm năng',
      interview: 'Bạn đã được mời phỏng vấn',
      offer: 'Bạn đã nhận được lời mời làm việc',
      accepted: 'Đơn ứng tuyển đã được chấp nhận',
      rejected: 'Đơn ứng tuyển không phù hợp',
      withdrawn: 'Đơn ứng tuyển đã được rút lại',
    };

    return this.createAndSend({
      recipientId: candidateId,
      type: NOTIFICATION_TYPES.APPLICATION_STATUS,
      title: statusTitles[status] || 'Cập nhật trạng thái đơn ứng tuyển',
      message: statusMessages[status] || `Trạng thái đơn ứng tuyển cho vị trí "${jobTitle}" đã thay đổi: ${status}`,
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
    const formattedTime = interviewTime.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const title =
      role === 'candidate'
        ? 'Bạn đã được mời phỏng vấn'
        : 'Lịch phỏng vấn đã được xác nhận';
    const message =
      role === 'candidate'
        ? `Bạn đã được mời tham gia phỏng vấn vào ${formattedTime}. Vui lòng chuẩn bị và có mặt đúng giờ.`
        : `Lịch phỏng vấn đã được xác nhận vào ${formattedTime}. Vui lòng chuẩn bị các câu hỏi và đánh giá ứng viên.`;

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
      message: `Chúng tôi tìm thấy vị trí "${jobTitle}" phù hợp ${matchScore}% với hồ sơ của bạn. Hãy xem chi tiết và ứng tuyển ngay!`,
      data: {
        jobId,
        matchScore,
      },
      priority: NOTIFICATION_PRIORITY.LOW,
    });
  }

  /**
   * Notify candidate về job invitation từ employer
   * @param {String} candidateId - Candidate user ID
   * @param {String} employerId - Employer user ID
   * @param {String} jobId - Job ID
   * @param {String} jobTitle - Job title
   * @param {String} companyName - Company name
   * @param {String} invitationLink - Link to job application page
   */
  static async notifyJobInvitation(
    candidateId,
    employerId,
    jobId,
    jobTitle,
    companyName,
    invitationLink
  ) {
    return this.createAndSend({
      recipientId: candidateId,
      senderId: employerId,
      type: NOTIFICATION_TYPES.JOB_INVITATION,
      title: `Bạn được mời ứng tuyển: ${jobTitle}`,
      message: `${companyName} đã mời bạn ứng tuyển cho vị trí "${jobTitle}". Nhấp để xem chi tiết và ứng tuyển ngay!`,
      data: {
        jobId,
        candidateId,
        companyName,
        jobTitle,
        invitationLink,
      },
      priority: NOTIFICATION_PRIORITY.MEDIUM,
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
   * Notify khi có tin nhắn mới
   * @param {String} recipientId - User ID nhận tin nhắn
   * @param {String} senderId - User ID gửi tin nhắn
   * @param {String} chatRoomId - Chat room ID
   * @param {String} messagePreview - Preview của tin nhắn
   */
  static async notifyNewMessage(recipientId, senderName, chatRoomId, messageContent) {
    return this.createAndSend({
      recipientId,
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: `Tin nhắn mới từ ${senderName}`,
      message: messageContent || 'Bạn có tin nhắn mới. Vui lòng kiểm tra hộp thư của bạn.',
      data: {
        chatRoomId,
        senderName,
      },
      priority: NOTIFICATION_PRIORITY.HIGH,
    });
  }

  /**
   * Notify candidate về skill recommendation
   * @param {String} candidateId - Candidate user ID
   * @param {Array<String>} recommendedSkills - Danh sách skills được recommend
   * @param {String} reason - Lý do recommend (job requirement, industry trend, etc.)
   */
  static async notifySkillRecommendation(candidateId, skillName, reason) {
    return this.createAndSend({
      recipientId: candidateId,
      type: NOTIFICATION_TYPES.SKILL_RECOMMENDATION,
      title: 'Gợi ý phát triển kỹ năng',
      message: `Chúng tôi gợi ý bạn nên phát triển kỹ năng "${skillName}" ${reason ? `vì ${reason}` : 'để tăng cơ hội tìm được việc làm phù hợp'}.`,
      data: {
        skillName,
        reason,
      },
      priority: NOTIFICATION_PRIORITY.LOW,
    });
  }

  /**
   * Notify employer khi verification được approve
   * @param {String} employerId - Employer user ID
   */
  static async notifyVerificationApproved(employerId, employerProfileId, companyName) {
    return this.createAndSend({
      recipientId: employerId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Xác thực tài khoản thành công',
      message: `Chúc mừng! Tài khoản doanh nghiệp "${companyName || 'của bạn'}" đã được xác thực thành công. Bạn có thể bắt đầu đăng tin tuyển dụng và tìm kiếm ứng viên ngay bây giờ.`,
      data: {
        employerProfileId,
        url: '/employer/dashboard',
      },
      priority: NOTIFICATION_PRIORITY.HIGH,
    });
  }

  /**
   * Notify employer khi verification bị reject
   * @param {String} employerId - Employer user ID
   * @param {String} reason - Lý do từ chối
   */
  static async notifyVerificationRejected(employerId, employerProfileId, companyName, reason) {
    return this.createAndSend({
      recipientId: employerId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Yêu cầu xác thực cần bổ sung',
      message: `Rất tiếc, yêu cầu xác thực tài khoản doanh nghiệp "${companyName || 'của bạn'}" chưa được duyệt. Lý do: ${reason || 'Vui lòng kiểm tra lại thông tin và tài liệu đã gửi, sau đó gửi lại yêu cầu xác thực.'}`,
      data: {
        employerProfileId,
        url: '/employer/verification',
        reason,
      },
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });
  }

  /**
   * Notify candidate khi job mới được tạo (job match)
   * @param {String} candidateId - Candidate user ID
   * @param {String} jobId - Job ID
   * @param {String} jobTitle - Job title
   * @param {String} companyName - Company name
   * @param {Number} matchScore - Match score (0-100)
   */
  static async notifyNewJobMatch(candidateId, jobId, jobTitle, companyName, matchScore) {
    return this.createAndSend({
      recipientId: candidateId,
      type: NOTIFICATION_TYPES.JOB_MATCH,
      title: 'Công việc mới phù hợp với bạn',
      message: `${companyName} vừa đăng tin tuyển dụng vị trí "${jobTitle}" phù hợp ${matchScore}% với hồ sơ của bạn. Đừng bỏ lỡ cơ hội này!`,
      data: {
        jobId,
        matchScore,
      },
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });
  }

  /**
   * Notify candidate khi application bị withdraw
   * @param {String} employerId - Employer user ID
   * @param {String} applicationId - Application ID
   * @param {String} jobTitle - Job title
   * @param {String} candidateName - Candidate name
   */
  static async notifyApplicationWithdrawn(employerId, applicationId, jobTitle, candidateName) {
    return this.createAndSend({
      recipientId: employerId,
      type: NOTIFICATION_TYPES.APPLICATION_STATUS,
      title: 'Ứng viên đã rút đơn ứng tuyển',
      message: `Ứng viên ${candidateName} đã rút lại đơn ứng tuyển cho vị trí "${jobTitle}". Đơn ứng tuyển này sẽ không còn trong danh sách ứng viên của bạn.`,
      data: {
        applicationId,
        status: 'withdrawn',
      },
      priority: NOTIFICATION_PRIORITY.LOW,
    });
  }

  /**
   * Cập nhật notification message khi candidate thay đổi thông tin
   * @param {String} candidateId - Candidate user ID
   * @param {String} newName - Tên mới của candidate
   */
  static async updateCandidateNameInNotifications(candidateId, newName) {
    try {
      const User = require('../../models/User');
      const user = await User.findById(candidateId);
      if (!user) {
        logger.warn('User not found when updating notification name', { candidateId });
        return;
      }

      const candidateName = user.fullName || user.email || 'Ứng viên';
      
      // Cập nhật tất cả notifications có candidateId này
      const notifications = await Notification.updateMany(
        {
          'data.candidateId': candidateId,
          type: NOTIFICATION_TYPES.NEW_APPLICATION,
        },
        {
          $set: {
            message: `Ứng viên ${candidateName} vừa gửi đơn ứng tuyển. Vui lòng xem xét hồ sơ trong thời gian sớm nhất.`,
          },
        }
      );

      logger.info('Updated candidate name in notifications', {
        candidateId,
        newName: candidateName,
        updatedCount: notifications.modifiedCount,
      });

      // Emit realtime update cho tất cả notifications đã cập nhật
      if (notifications.modifiedCount > 0) {
        try {
          const io = getIO();
          const updatedNotifications = await Notification.find({
            'data.candidateId': candidateId,
            type: NOTIFICATION_TYPES.NEW_APPLICATION,
          }).limit(10); // Limit để tránh quá nhiều events

          for (const notif of updatedNotifications) {
            io.to(`user:${notif.recipient}`).emit('notification_updated', {
              notificationId: notif._id,
              message: notif.message,
            });
          }
        } catch (socketError) {
          logger.error('Failed to emit notification updates via socket', {
            error: socketError.message,
          });
        }
      }

      return notifications;
    } catch (error) {
      logger.error('Error updating candidate name in notifications', {
        error: error.message,
        candidateId,
      });
      throw error;
    }
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

