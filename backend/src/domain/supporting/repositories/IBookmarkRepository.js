/**
 * IBookmarkRepository Interface
 * Domain: Supporting
 * Repository interface for Bookmark entity
 */
class IBookmarkRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findByType(userId, bookmarkType) {
    throw new Error('Method not implemented');
  }

  async findByItem(userId, bookmarkType, itemId) {
    throw new Error('Method not implemented');
  }

  async findByTag(userId, tag) {
    throw new Error('Method not implemented');
  }

  async findActive(userId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(bookmark) {
    throw new Error('Method not implemented');
  }

  async update(bookmark) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }

  async bulkDeleteByUser(userId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IBookmarkRepository;