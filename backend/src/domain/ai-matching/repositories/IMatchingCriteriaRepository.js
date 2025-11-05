/**
 * IMatchingCriteriaRepository Interface
 * Domain: AI-Matching
 * Repository interface for MatchingCriteria entity
 */
class IMatchingCriteriaRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findActive() {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(criteria) {
    throw new Error('Method not implemented');
  }

  async update(criteria) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IMatchingCriteriaRepository;