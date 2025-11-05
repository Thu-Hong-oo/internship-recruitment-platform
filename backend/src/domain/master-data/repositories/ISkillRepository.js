/**
 * ISkillRepository Interface
 * Domain: Master-Data
 * Repository interface for Skill entity
 */
class ISkillRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findByCategory(categoryId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(skill) {
    throw new Error('Method not implemented');
  }

  async update(skill) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ISkillRepository;