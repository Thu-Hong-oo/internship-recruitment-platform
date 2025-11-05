/**
 * Get User Notifications Use Case
 * Retrieves notifications for a specific user
 */

class GetUserNotificationsUseCase {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type,
        category,
        priority,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      // Build query
      const query = { recipientId: userId };

      if (unreadOnly) {
        query.readAt = null;
      }

      if (type) {
        query.type = type;
      }

      if (category) {
        query.category = category;
      }

      if (priority) {
        query.priority = priority;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Only show delivered and read notifications (not pending/failed)
      query.status = { $in: ['delivered', 'read'] };

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [notifications, total, unreadCount] = await Promise.all([
        this.notificationRepository.find(query, { skip, limit, sort }),
        this.notificationRepository.count(query),
        this.notificationRepository.count({
          recipientId: userId,
          readAt: null,
          status: 'delivered',
        }),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      // Group notifications by date for better UX
      const groupedNotifications =
        this._groupNotificationsByDate(notifications);

      return {
        success: true,
        data: {
          notifications: groupedNotifications,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
          stats: {
            unreadCount,
            totalCount: total,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _groupNotificationsByDate(notifications) {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      const notificationDay = new Date(
        notificationDate.getFullYear(),
        notificationDate.getMonth(),
        notificationDate.getDate()
      );

      let groupKey;

      if (notificationDay.getTime() === today.getTime()) {
        groupKey = 'Today';
      } else if (notificationDay.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday';
      } else if (notificationDay >= weekAgo) {
        groupKey = this._getDayName(notificationDate);
      } else {
        groupKey = this._formatDate(notificationDate);
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(notification);
    });

    // Convert to array and sort by recency
    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        notifications: items,
        count: items.length,
        unreadCount: items.filter(n => !n.readAt).length,
      }))
      .sort((a, b) => {
        // Custom sort to put Today, Yesterday, etc. first
        const order = ['Today', 'Yesterday'];
        const aIndex = order.indexOf(a.date);
        const bIndex = order.indexOf(b.date);

        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        } else if (aIndex !== -1) {
          return -1;
        } else if (bIndex !== -1) {
          return 1;
        } else {
          // For other dates, sort by most recent first
          return new Date(b.date) - new Date(a.date);
        }
      });
  }

  _getDayName(date) {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  }

  _formatDate(date) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }
}

module.exports = GetUserNotificationsUseCase;
