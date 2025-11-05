/**
 * ILearningModuleRepository Interface
 * Domain: Learning
 * Repository interface for LearningModule entity
 */
class ILearningModuleRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByLearningPathId(learningPathId) {
    throw new Error('Method not implemented');
  }

  async findBySkill(skillId) {
    throw new Error('Method not implemented');
  }

  async findActive() {
    throw new Error('Method not implemented');
  }

  async findByOrder(learningPathId, order) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(learningModule) {
    throw new Error('Method not implemented');
  }

  async update(learningModule) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }

  async reorderModules(learningPathId, moduleOrders) {
    throw new Error('Method not implemented');
  }
}

module.exports = ILearningModuleRepository;