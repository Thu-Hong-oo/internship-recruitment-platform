/**
 * Admin Repository Interface
 * Defines the contract for admin data access operations
 */
class IAdminRepository {
  /**
   * Get system dashboard statistics
   * @returns {Promise<Object>} Dashboard data
   */
  async getSystemDashboard() {
    throw new Error('Method not implemented');
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Users with pagination
   */
  async getAllUsers(options) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async getUserById(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Update user by ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateUserById(userId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete user by ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUserById(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all jobs with admin filters
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Jobs with pagination
   */
  async getAllJobs(options) {
    throw new Error('Method not implemented');
  }

  /**
   * Update job status
   * @param {string} jobId - Job ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated job
   */
  async updateJobStatus(jobId, status) {
    throw new Error('Method not implemented');
  }

  /**
   * Get system statistics
   * @returns {Promise<Object>} System stats
   */
  async getSystemStats() {
    throw new Error('Method not implemented');
  }

  /**
   * Get recent activities
   * @param {number} limit - Number of activities to return
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivities(limit) {
    throw new Error('Method not implemented');
  }
}

module.exports = IAdminRepository;
