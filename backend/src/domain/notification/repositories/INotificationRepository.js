/**
 * INotificationRepository Interface
 * Domain: Notification
 * Repository interface for Notification entity
 */
class INotificationRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByType(notificationType) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findByDeliveryMethod(deliveryMethod) {
    throw new Error('Method not implemented');
  }

  async findUnreadByUser(userId) {
    throw new Error('Method not implemented');
  }

  async findByReferenceId(referenceId) {
    throw new Error('Method not implemented');
  }

  async findExpired() {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(notification) {
    throw new Error('Method not implemented');
  }

  async update(notification) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }

  async markAsRead(id) {
    throw new Error('Method not implemented');
  }

  async markAsDelivered(id) {
    throw new Error('Method not implemented');
  }

  async bulkMarkAsRead(userId, notificationIds) {
    throw new Error('Method not implemented');
  }
}

module.exports = INotificationRepository;