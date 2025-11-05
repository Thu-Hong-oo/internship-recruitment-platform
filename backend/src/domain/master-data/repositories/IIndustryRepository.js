/**
 * IIndustryRepository Interface
 * Domain: Master-Data
 * Repository interface for Industry entity
 */
class IIndustryRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findByParent(parentId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(industry) {
    throw new Error('Method not implemented');
  }

  async update(industry) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IIndustryRepository;