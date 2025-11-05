/**
 * Mark Notification As Read Use Case
 * Marks one or more notifications as read
 */

class MarkNotificationAsReadUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(userId, notificationIds) {
    try {
      // Validate inputs
      if (!Array.isArray(notificationIds)) {
        notificationIds = [notificationIds];
      }

      if (notificationIds.length === 0) {
        throw new Error('No notification IDs provided');
      }

      // Find notifications belonging to the user
      const notifications = await this.notificationRepository.find({
        _id: { $in: notificationIds },
        recipientId: userId,
        readAt: null, // Only mark unread notifications
      });

      if (notifications.length === 0) {
        return {
          success: true,
          data: { markedCount: 0 },
          message: 'No unread notifications found to mark as read',
        };
      }

      // Mark notifications as read
      const readAt = new Date();
      const updatePromises = notifications.map(notification =>
        this.notificationRepository.update(notification.id, {
          readAt,
          status: 'read',
          updatedAt: new Date(),
        })
      );

      await Promise.all(updatePromises);

      // Get updated unread count
      const unreadCount = await this.notificationRepository.count({
        recipientId: userId,
        readAt: null,
        status: 'delivered',
      });

      return {
        success: true,
        data: {
          markedCount: notifications.length,
          markedNotifications: notifications.map(n => ({
            id: n.id,
            title: n.title,
            readAt,
          })),
          unreadCount,
        },
        message: `Marked ${notifications.length} notification(s) as read`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = MarkNotificationAsReadUseCase;
