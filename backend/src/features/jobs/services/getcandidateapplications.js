/**
 * Use case for getting candidate applications
 */
const getCandidateApplications = ({}) => {
  /**
   * Execute the get candidate applications use case
   * @param {Object} input
   * @param {string} input.candidateId - Candidate ID
   * @param {Object} input.filters - Filter criteria
   * @param {Object} input.options - Pagination options
   * @returns {Promise<Object>} Applications result
   */
  return async ({ candidateId, filters, options }) => {
    try {
      logger.info('Getting candidate applications', {
        candidateId,
        filters,
        options,
      });

      const result = await applicationRepository.findByCandidateId(
        candidateId,
        { ...filters, ...options }
      );

      logger.info('Candidate applications retrieved successfully', {
        candidateId,
        count: result.applications.length,
      });

      return {
        success: true,
        applications: result.applications,
        pagination: result.pagination,
      };
    } catch (error) {
      logger.error('Get candidate applications error:', error);
      throw error;
    }
  };
};

module.exports = getCandidateApplications;
