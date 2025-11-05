/**
 * Job Repository Interface
 * Defines the contract for job data access operations
 */
class IJobRepository {
  /**
   * Create a new job post
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Created job
   */
  async create(jobData) {
    throw new Error('Method not implemented');
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Job object or null
   */
  async findById(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get job by slug
   * @param {string} slug - Job slug
   * @returns {Promise<Object|null>} Job object or null
   */
  async findBySlug(slug) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all jobs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} Jobs with pagination info
   */
  async findAll(filters, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Update job by ID
   * @param {string} jobId - Job ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated job or null
   */
  async updateById(jobId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteById(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get jobs by employer ID
   * @param {string} employerId - Employer ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Array of jobs
   */
  async findByEmployerId(employerId, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Get draft jobs by employer ID
   * @param {string} employerId - Employer ID
   * @returns {Promise<Array>} Array of draft jobs
   */
  async findDraftByEmployerId(employerId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get recent jobs
   * @param {number} limit - Number of jobs to return
   * @returns {Promise<Array>} Array of recent jobs
   */
  async findRecent(limit) {
    throw new Error('Method not implemented');
  }

  /**
   * Get job applications
   * @param {string} jobId - Job ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Applications with pagination
   */
  async getJobApplications(jobId, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Get job stats
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job statistics
   */
  async getJobStats(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Increment job views
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Updated job
   */
  async incrementViews(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Submit job for review
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Updated job
   */
  async submitForReview(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Count jobs matching criteria
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria) {
    throw new Error('Method not implemented');
  }
}

module.exports = IJobRepository;
