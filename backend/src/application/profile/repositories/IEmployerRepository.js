// Employer Repository Interface
class IEmployerRepository {
  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async create(data) {
    throw new Error('Method not implemented');
  }

  async update(id, data) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findAll(query) {
    throw new Error('Method not implemented');
  }

  async count(query) {
    throw new Error('Method not implemented');
  }
}

module.exports = IEmployerRepository;
