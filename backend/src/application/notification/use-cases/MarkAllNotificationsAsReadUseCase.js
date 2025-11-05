/**
 * Mark All Notifications As Read Use Case
 * Marks all unread notifications for a user as read
 */

class MarkAllNotificationsAsReadUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(userId, filters = {}) {
    try {
      // Build query for unread notifications
      const query = {
        recipientId: userId,
        readAt: null,
        status: 'delivered',
      };

      // Apply optional filters
      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.beforeDate) {
        query.createdAt = { $lte: new Date(filters.beforeDate) };
      }

      // Get count of notifications to be marked
      const unreadNotifications = await this.notificationRepository.find(query);

      if (unreadNotifications.length === 0) {
        return {
          success: true,
          data: { markedCount: 0 },
          message: 'No unread notifications found',
        };
      }

      // Mark all as read
      const readAt = new Date();
      const updateData = {
        readAt,
        status: 'read',
        updatedAt: new Date(),
      };

      // Bulk update
      await this.notificationRepository.updateMany(query, updateData);

      // Get remaining unread count (after filtering)
      const remainingUnreadCount = await this.notificationRepository.count({
        recipientId: userId,
        readAt: null,
        status: 'delivered',
      });

      return {
        success: true,
        data: {
          markedCount: unreadNotifications.length,
          remainingUnreadCount,
          readAt,
        },
        message: `Marked ${unreadNotifications.length} notification(s) as read`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = MarkAllNotificationsAsReadUseCase;
