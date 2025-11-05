// Notification Use Cases Index
const CreateNotificationUseCase = require('./CreateNotificationUseCase');
const GetUserNotificationsUseCase = require('./GetUserNotificationsUseCase');
const MarkNotificationAsReadUseCase = require('./MarkNotificationAsReadUseCase');
const MarkAllNotificationsAsReadUseCase = require('./MarkAllNotificationsAsReadUseCase');
const DeleteNotificationUseCase = require('./DeleteNotificationUseCase');
const GetNotificationSettingsUseCase = require('./GetNotificationSettingsUseCase');
const UpdateNotificationSettingsUseCase = require('./UpdateNotificationSettingsUseCase');

module.exports = {
  CreateNotificationUseCase,
  GetUserNotificationsUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllNotificationsAsReadUseCase,
  DeleteNotificationUseCase,
  GetNotificationSettingsUseCase,
  UpdateNotificationSettingsUseCase,
};
