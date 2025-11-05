/**
 * ICandidateRepository Interface
 * Domain: Supporting
 * Repository interface for Candidate entity
 */
class ICandidateRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(candidateData) {
    throw new Error('Method not implemented');
  }

  async update(id, candidateData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findBySkills(skillIds) {
    throw new Error('Method not implemented');
  }

  async search(query, filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByIds(ids) {
    throw new Error('Method not implemented');
  }
}

module.exports = ICandidateRepository;
