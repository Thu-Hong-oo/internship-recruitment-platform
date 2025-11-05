/**
 * ICandidateRepository
 * Domain: Profile
 * Repository interface for Candidate entity
 */
class ICandidateRepository {
  /**
   * Find candidate by ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object|null>} Candidate entity
   */
  async findById(candidateId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find candidate by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Candidate entity
   */
  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all candidates
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of candidates
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Create new candidate
   * @param {Object} candidateData - Candidate data
   * @returns {Promise<Object>} Created candidate
   */
  async create(candidateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update candidate
   * @param {string} candidateId - Candidate ID
   * @param {Object} candidateData - Updated data
   * @returns {Promise<Object|null>} Updated candidate
   */
  async update(candidateId, candidateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(candidateId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find candidates by skills
   * @param {Array} skillIds - Array of skill IDs
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching candidates
   */
  async findBySkills(skillIds, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find candidates by location
   * @param {string} location - Location
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Candidates in location
   */
  async findByLocation(location, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find candidates by education level
   * @param {string} degree - Degree level
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Candidates with education
   */
  async findByEducationLevel(degree, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update candidate skills
   * @param {string} candidateId - Candidate ID
   * @param {Array} skills - Skills array
   * @returns {Promise<Object|null>} Updated candidate
   */
  async updateSkills(candidateId, skills) {
    throw new Error('Method not implemented');
  }

  /**
   * Update candidate education
   * @param {string} candidateId - Candidate ID
   * @param {Array} education - Education array
   * @returns {Promise<Object|null>} Updated candidate
   */
  async updateEducation(candidateId, education) {
    throw new Error('Method not implemented');
  }

  /**
   * Update candidate experience
   * @param {string} candidateId - Candidate ID
   * @param {Array} experience - Experience array
   * @returns {Promise<Object|null>} Updated candidate
   */
  async updateExperience(candidateId, experience) {
    throw new Error('Method not implemented');
  }

  /**
   * Search candidates with advanced filters
   * @param {Object} searchCriteria - Search criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchCandidates(searchCriteria, pagination = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get candidate statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getStatistics() {
    throw new Error('Method not implemented');
  }
}

module.exports = ICandidateRepository;
