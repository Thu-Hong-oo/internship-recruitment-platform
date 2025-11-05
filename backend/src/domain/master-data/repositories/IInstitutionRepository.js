/**
 * IInstitutionRepository Interface
 * Domain: Master-Data
 * Repository interface for Institution entity
 */
class IInstitutionRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findByType(type) {
    throw new Error('Method not implemented');
  }

  async findByLocation(provinceCode) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(institution) {
    throw new Error('Method not implemented');
  }

  async update(institution) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IInstitutionRepository;