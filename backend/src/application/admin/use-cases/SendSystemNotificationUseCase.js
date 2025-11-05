const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * SendSystemNotificationUseCase
 * Use case for sending system notifications
 */
class SendSystemNotificationUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(notificationData) {
    try {
      if (!notificationData || !notificationData.message) {
        throw new Error('Notification message is required');
      }

      const result = await this.adminRepository.sendSystemNotification(
        notificationData
      );
      return {
        message: result.message || 'System notification sent successfully',
        notification: result.notification || notificationData,
      };
    } catch (error) {
      throw new Error(`Failed to send system notification: ${error.message}`);
    }
  }
}

module.exports = SendSystemNotificationUseCase;
