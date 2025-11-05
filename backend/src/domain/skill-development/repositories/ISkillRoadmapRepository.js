/**
 * ISkillRoadmapRepository
 * Domain: Skill Development
 * Repository interface for SkillRoadmap entity
 */
class ISkillRoadmapRepository {
  /**
   * Find skill roadmap by ID
   * @param {string} roadmapId - Roadmap ID
   * @returns {Promise<Object|null>} Skill roadmap entity
   */
  async findById(roadmapId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find skill roadmap by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object|null>} Skill roadmap entity
   */
  async findByCandidateId(candidateId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all skill roadmaps
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of skill roadmaps
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Create new skill roadmap
   * @param {Object} roadmapData - Roadmap data
   * @returns {Promise<Object>} Created roadmap
   */
  async create(roadmapData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update skill roadmap
   * @param {string} roadmapId - Roadmap ID
   * @param {Object} roadmapData - Updated data
   * @returns {Promise<Object|null>} Updated roadmap
   */
  async update(roadmapId, roadmapData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete skill roadmap
   * @param {string} roadmapId - Roadmap ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(roadmapId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find roadmaps by skill gaps
   * @param {Array} skillGapIds - Array of skill gap IDs
   * @returns {Promise<Array>} Roadmaps for skill gaps
   */
  async findBySkillGaps(skillGapIds) {
    throw new Error('Method not implemented');
  }

  /**
   * Find roadmaps by target role
   * @param {string} targetRole - Target role
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Roadmaps for target role
   */
  async findByTargetRole(targetRole, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update roadmap progress
   * @param {string} roadmapId - Roadmap ID
   * @param {Object} progressData - Progress data
   * @returns {Promise<Object|null>} Updated roadmap
   */
  async updateProgress(roadmapId, progressData) {
    throw new Error('Method not implemented');
  }

  /**
   * Add milestone to roadmap
   * @param {string} roadmapId - Roadmap ID
   * @param {Object} milestone - Milestone data
   * @returns {Promise<Object|null>} Updated roadmap
   */
  async addMilestone(roadmapId, milestone) {
    throw new Error('Method not implemented');
  }

  /**
   * Complete milestone
   * @param {string} roadmapId - Roadmap ID
   * @param {string} milestoneId - Milestone ID
   * @returns {Promise<Object|null>} Updated roadmap
   */
  async completeMilestone(roadmapId, milestoneId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get roadmap statistics
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object>} Statistics data
   */
  async getRoadmapStatistics(candidateId) {
    throw new Error('Method not implemented');
  }
}

module.exports = ISkillRoadmapRepository;
