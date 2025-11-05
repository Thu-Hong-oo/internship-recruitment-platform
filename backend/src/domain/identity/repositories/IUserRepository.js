/**
 * IUserRepository Interface
 * Domain: Identity
 * Repository interface for User entity
 */
class IUserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findByUsername(username) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(userData) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findByRole(role) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async updateLastLogin(id) {
    throw new Error('Method not implemented');
  }

  async findByIds(ids) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
