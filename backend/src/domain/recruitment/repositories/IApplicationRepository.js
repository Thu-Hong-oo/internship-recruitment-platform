/**
 * IApplicationRepository Interface
 * Domain: Recruitment
 * Repository interface for Application entity
 */
class IApplicationRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByJob(jobId) {
    throw new Error('Method not implemented');
  }

  async findByCandidate(candidateId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(applicationData) {
    throw new Error('Method not implemented');
  }

  async update(id, applicationData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findByJobAndCandidate(jobId, candidateId) {
    throw new Error('Method not implemented');
  }

  async countByJob(jobId) {
    throw new Error('Method not implemented');
  }

  async countByCandidate(candidateId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IApplicationRepository;
