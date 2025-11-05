/**
 * ILearningPathRepository Interface
 * Domain: Learning
 * Repository interface for LearningPath entity
 */
class ILearningPathRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByTitle(title) {
    throw new Error('Method not implemented');
  }

  async findByType(type) {
    throw new Error('Method not implemented');
  }

  async findBySkill(skillId) {
    throw new Error('Method not implemented');
  }

  async findActive() {
    throw new Error('Method not implemented');
  }

  async findByCreator(creatorId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(learningPath) {
    throw new Error('Method not implemented');
  }

  async update(learningPath) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ILearningPathRepository;