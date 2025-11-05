/**
 * IJobRepository Interface
 * Domain: Recruitment
 * Repository interface for Job entity
 */
class IJobRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmployer(employerId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(jobData) {
    throw new Error('Method not implemented');
  }

  async update(id, jobData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async search(query, filters = {}, limit = 10, skip = 0) {
    throw new Error('Method not implemented');
  }

  async findActiveJobs() {
    throw new Error('Method not implemented');
  }

  async findByIds(ids) {
    throw new Error('Method not implemented');
  }
}

module.exports = IJobRepository;
