/**
 * IMatchingHistoryRepository
 * Domain: AI/NLP
 * Repository interface for MatchingHistory entity
 */
class IMatchingHistoryRepository {
  /**
   * Find matching history by ID
   * @param {string} historyId - History ID
   * @returns {Promise<Object|null>} Matching history entity
   */
  async findById(historyId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find matching history by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of matching histories
   */
  async findByCandidateId(candidateId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find matching history by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of matching histories
   */
  async findByJobId(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find matching history by candidate and job IDs
   * @param {string} candidateId - Candidate ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of matching histories
   */
  async findByCandidateAndJob(candidateId, jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all matching histories
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of matching histories
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Create new matching history
   * @param {Object} historyData - History data
   * @returns {Promise<Object>} Created history
   */
  async create(historyData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update matching history
   * @param {string} historyId - History ID
   * @param {Object} historyData - Updated data
   * @returns {Promise<Object|null>} Updated history
   */
  async update(historyId, historyData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete matching history
   * @param {string} historyId - History ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(historyId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find histories by score range
   * @param {number} minScore - Minimum score
   * @param {number} maxScore - Maximum score
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching histories in score range
   */
  async findByScoreRange(minScore, maxScore, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find histories by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching histories in date range
   */
  async findByDateRange(startDate, endDate, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find top matches for candidate
   * @param {string} candidateId - Candidate ID
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Top matching histories
   */
  async findTopMatchesForCandidate(candidateId, limit = 10) {
    throw new Error('Method not implemented');
  }

  /**
   * Find top matches for job
   * @param {string} jobId - Job ID
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Top matching histories
   */
  async findTopMatchesForJob(jobId, limit = 20) {
    throw new Error('Method not implemented');
  }

  /**
   * Get matching statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Statistics data
   */
  async getMatchingStatistics(filters = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get average scores by time period
   * @param {string} period - Time period (day, week, month)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Average scores over time
   */
  async getAverageScoresByPeriod(period, filters = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Clean old matching histories
   * @param {Date} beforeDate - Delete records before this date
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanOldHistories(beforeDate) {
    throw new Error('Method not implemented');
  }

  /**
   * Get matching trends
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Trend analysis data
   */
  async getMatchingTrends(filters = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = IMatchingHistoryRepository;
