/**
 * ISavedJobRepository Interface
 * Domain: Supporting
 * Repository interface for SavedJob entity
 */
class ISavedJobRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findByJobId(jobId) {
    throw new Error('Method not implemented');
  }

  async findByUserAndJob(userId, jobId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findByTag(userId, tag) {
    throw new Error('Method not implemented');
  }

  async findWithReminders(userId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(savedJob) {
    throw new Error('Method not implemented');
  }

  async update(savedJob) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ISavedJobRepository;