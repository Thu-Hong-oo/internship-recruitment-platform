/**
 * Application Repository Interface
 * Defines the contract for application data access operations
 */
class IApplicationRepository {
  /**
   * Create a new application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Created application
   */
  async create(applicationData) {
    throw new Error('Method not implemented');
  }

  /**
   * Get application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object|null>} Application object or null
   */
  async findById(applicationId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get applications by candidate ID
   * @param {string} candidateId - Candidate ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Applications with pagination
   */
  async findByCandidateId(candidateId, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Get applications by job ID
   * @param {string} jobId - Job ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Applications with pagination
   */
  async findByJobId(jobId, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Update application by ID
   * @param {string} applicationId - Application ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated application or null
   */
  async updateById(applicationId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteById(applicationId) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if candidate has applied for job
   * @param {string} candidateId - Candidate ID
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Whether candidate has applied
   */
  async hasCandidateAppliedForJob(candidateId, jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get application statistics
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Application statistics
   */
  async getApplicationStats(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Count applications matching criteria
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria) {
    throw new Error('Method not implemented');
  }
}

module.exports = IApplicationRepository;
