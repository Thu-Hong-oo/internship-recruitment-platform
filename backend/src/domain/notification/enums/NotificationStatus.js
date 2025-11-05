/**
 * NotificationStatus Enum
 * Domain: Notification
 * Represents the status of a notification
 */
const NotificationStatus = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
});

module.exports = NotificationStatus;