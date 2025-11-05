/**
 * IJobSkillRequirementRepository Interface
 * Domain: Master-Data
 * Repository interface for JobSkillRequirement entity
 */
class IJobSkillRequirementRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByJob(jobId) {
    throw new Error('Method not implemented');
  }

  async findBySkill(skillId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(requirement) {
    throw new Error('Method not implemented');
  }

  async update(requirement) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IJobSkillRequirementRepository;