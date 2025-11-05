/**
 * ISkillGapAnalysisRepository
 * Domain: Skill Development
 * Repository interface for SkillGapAnalysis entity
 */
class ISkillGapAnalysisRepository {
  /**
   * Find skill gap analysis by ID
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<Object|null>} Skill gap analysis entity
   */
  async findById(analysisId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find skill gap analysis by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object|null>} Skill gap analysis entity
   */
  async findByCandidateId(candidateId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find skill gap analysis by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Skill gap analysis entity
   */
  async findByJobId(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all skill gap analyses
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of skill gap analyses
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Create new skill gap analysis
   * @param {Object} analysisData - Analysis data
   * @returns {Promise<Object>} Created analysis
   */
  async create(analysisData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update skill gap analysis
   * @param {string} analysisId - Analysis ID
   * @param {Object} analysisData - Updated data
   * @returns {Promise<Object|null>} Updated analysis
   */
  async update(analysisId, analysisData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete skill gap analysis
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(analysisId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find analyses by skill gaps
   * @param {Array} skillIds - Array of skill IDs
   * @returns {Promise<Array>} Analyses containing skill gaps
   */
  async findBySkillGaps(skillIds) {
    throw new Error('Method not implemented');
  }

  /**
   * Find analyses by priority level
   * @param {string} priority - Priority level (high, medium, low)
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Analyses by priority
   */
  async findByPriority(priority, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find analyses by time estimate
   * @param {number} minMonths - Minimum months
   * @param {number} maxMonths - Maximum months
   * @returns {Promise<Array>} Analyses within time range
   */
  async findByTimeEstimate(minMonths, maxMonths) {
    throw new Error('Method not implemented');
  }

  /**
   * Update gap status
   * @param {string} analysisId - Analysis ID
   * @param {string} gapId - Gap ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} Updated analysis
   */
  async updateGapStatus(analysisId, gapId, status) {
    throw new Error('Method not implemented');
  }

  /**
   * Add learning resource to gap
   * @param {string} analysisId - Analysis ID
   * @param {string} gapId - Gap ID
   * @param {Object} resource - Learning resource
   * @returns {Promise<Object|null>} Updated analysis
   */
  async addLearningResource(analysisId, gapId, resource) {
    throw new Error('Method not implemented');
  }

  /**
   * Get analysis statistics
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object>} Statistics data
   */
  async getAnalysisStatistics(candidateId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find analyses requiring immediate attention
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Urgent analyses
   */
  async findUrgentAnalyses(options = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = ISkillGapAnalysisRepository;
