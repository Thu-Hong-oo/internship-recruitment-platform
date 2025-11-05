/**
 * INotificationTemplateRepository Interface
 * Domain: Notification
 * Repository interface for NotificationTemplate entity
 */
class INotificationTemplateRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findByType(notificationType) {
    throw new Error('Method not implemented');
  }

  async findByDeliveryMethod(deliveryMethod) {
    throw new Error('Method not implemented');
  }

  async findActive() {
    throw new Error('Method not implemented');
  }

  async findByLanguage(language) {
    throw new Error('Method not implemented');
  }

  async findByTypeAndMethod(notificationType, deliveryMethod) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(notificationTemplate) {
    throw new Error('Method not implemented');
  }

  async update(notificationTemplate) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = INotificationTemplateRepository;