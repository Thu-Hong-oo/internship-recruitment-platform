/**
 * NotificationType Enum
 * Domain: Notification
 * Represents different types of notifications
 */
const NotificationType = Object.freeze({
  APPLICATION_UPDATE: 'application_update',
  JOB_MATCH: 'job_match',
  DEADLINE_REMINDER: 'deadline_reminder',
  SYSTEM_ALERT: 'system_alert',
  COMPANY_NEWS: 'company_news',
});

module.exports = NotificationType;
