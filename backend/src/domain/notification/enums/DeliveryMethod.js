/**
 * DeliveryMethod Enum
 * Domain: Notification
 * Represents different methods for delivering notifications
 */
const DeliveryMethod = Object.freeze({
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH_NOTIFICATION: 'PUSH_NOTIFICATION',
  IN_APP: 'IN_APP',
  WEBHOOK: 'WEBHOOK'
});

module.exports = DeliveryMethod;