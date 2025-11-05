// Notification Domain Exports
// Entities
const Notification = require('./entities/Notification');
const NotificationTemplate = require('./entities/NotificationTemplate');

// Enums
const NotificationType = require('./enums/NotificationType');
const DeliveryMethod = require('./enums/DeliveryMethod');
const NotificationStatus = require('./enums/NotificationStatus');

// Value Objects
const NotificationPriority = require('./value-objects/NotificationPriority');

// Domain Services
const NotificationService = require('./services/NotificationService');

// Repository Interfaces
const INotificationRepository = require('./repositories/INotificationRepository');
const INotificationTemplateRepository = require('./repositories/INotificationTemplateRepository');

module.exports = {
  // Entities
  Notification,
  NotificationTemplate,

  // Enums
  NotificationType,
  DeliveryMethod,
  NotificationStatus,

  // Value Objects
  NotificationPriority,

  // Domain Services
  NotificationService,

  // Repository Interfaces
  INotificationRepository,
  INotificationTemplateRepository,
};
