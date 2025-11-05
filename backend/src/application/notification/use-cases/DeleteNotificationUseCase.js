/**
 * Delete Notification Use Case
 * Deletes one or more notifications for a user
 */

class DeleteNotificationUseCase {
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
      });

      if (notifications.length === 0) {
        return {
          success: true,
          data: { deletedCount: 0 },
          message: 'No notifications found to delete',
        };
      }

      // Delete notifications
      const deletePromises = notifications.map(notification =>
        this.notificationRepository.delete(notification.id)
      );

      await Promise.all(deletePromises);

      // Get updated counts
      const [totalCount, unreadCount] = await Promise.all([
        this.notificationRepository.count({ recipientId: userId }),
        this.notificationRepository.count({
          recipientId: userId,
          readAt: null,
          status: 'delivered',
        }),
      ]);

      return {
        success: true,
        data: {
          deletedCount: notifications.length,
          deletedNotifications: notifications.map(n => ({
            id: n.id,
            title: n.title,
            type: n.type,
          })),
          remainingTotalCount: totalCount,
          remainingUnreadCount: unreadCount,
        },
        message: `Deleted ${notifications.length} notification(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = DeleteNotificationUseCase;
