/**
 * Get Matching History Use Case
 * Retrieves AI matching history for analysis
 */

class GetMatchingHistoryUseCase {
  constructor(matchingHistoryRepository) {
    this.matchingHistoryRepository = matchingHistoryRepository;
  }

  async execute(userId, userType, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        jobId,
        candidateId,
        minScore,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      // Build query based on user type
      let query = {};
      if (userType === 'candidate') {
        query.candidateId = userId;
      } else if (userType === 'employer') {
        // For employers, show matches for their jobs
        query.jobId = { $in: await this._getEmployerJobIds(userId) };
      }

      // Apply additional filters
      if (jobId) query.jobId = jobId;
      if (candidateId) query.candidateId = candidateId;
      if (minScore) query.matchScore = { $gte: minScore };

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [history, total] = await Promise.all([
        this.matchingHistoryRepository.find(query, { skip, limit, sort }),
        this.matchingHistoryRepository.count(query),
      ]);

      return {
        success: true,
        data: {
          history,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _getEmployerJobIds(employerId) {
    // This would get job IDs for the employer
    // Implementation depends on your job repository structure
    return [];
  }
}

module.exports = GetMatchingHistoryUseCase;
