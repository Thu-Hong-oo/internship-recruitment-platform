/**
 * IDegreeRepository Interface
 * Domain: Master-Data
 * Repository interface for Degree entity
 */
class IDegreeRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findByLevel(level) {
    throw new Error('Method not implemented');
  }

  async findByInstitution(institutionId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(degree) {
    throw new Error('Method not implemented');
  }

  async update(degree) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IDegreeRepository;