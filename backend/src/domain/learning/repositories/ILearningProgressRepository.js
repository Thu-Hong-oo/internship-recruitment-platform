/**
 * ILearningProgressRepository Interface
 * Domain: Learning
 * Repository interface for LearningProgress entity
 */
class ILearningProgressRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findByLearningPathId(learningPathId) {
    throw new Error('Method not implemented');
  }

  async findByUserAndPath(userId, learningPathId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findCompletedByUser(userId) {
    throw new Error('Method not implemented');
  }

  async findInProgressByUser(userId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(learningProgress) {
    throw new Error('Method not implemented');
  }

  async update(learningProgress) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ILearningProgressRepository;