/**
 * ICandidateSkillRepository Interface
 * Domain: Master-Data
 * Repository interface for CandidateSkill entity
 */
class ICandidateSkillRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByCandidate(candidateId) {
    throw new Error('Method not implemented');
  }

  async findBySkill(skillId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(candidateSkill) {
    throw new Error('Method not implemented');
  }

  async update(candidateSkill) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ICandidateSkillRepository;