/**
 * AiMatchingRepository
 * Infrastructure Layer - AI/NLP Domain
 * Repository for AI matching data persistence
 */
const IMatchingHistoryRepository = require('../../domain/ai-nlp/repositories/IMatchingHistoryRepository');

class AiMatchingRepository extends IMatchingHistoryRepository {
  constructor(props) {
    super();
    this.model = props.aiMatchingModel;
  }

  /**
   * Find matching history by ID
   * @param {string} historyId - History ID
   * @returns {Promise<Object|null>} Matching history entity
   */
  async findById(historyId) {
    return await this.model.findById(historyId).lean();
  }

  /**
   * Find matching history by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of matching histories
   */
  async findByCandidateId(candidateId) {
    return await this.model
      .find({ candidateId })
      .sort({ matchedAt: -1 })
      .lean();
  }

  /**
   * Find matching history by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of matching histories
   */
  async findByJobId(jobId) {
    return await this.model.find({ jobId }).sort({ matchedAt: -1 }).lean();
  }

  /**
   * Find matching history by candidate and job IDs
   * @param {string} candidateId - Candidate ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of matching histories
   */
  async findByCandidateAndJob(candidateId, jobId) {
    return await this.model
      .find({ candidateId, jobId })
      .sort({ matchedAt: -1 })
      .lean();
  }

  /**
   * Find all matching histories
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of matching histories
   */
  async findAll(filters = {}, pagination = {}) {
    const query = this.buildQuery(filters);
    const options = this.buildPaginationOptions(pagination);

    return await this.model.find(query, null, options).lean();
  }

  /**
   * Create new matching history
   * @param {Object} historyData - History data
   * @returns {Promise<Object>} Created history
   */
  async create(historyData) {
    const history = new this.model(historyData);
    return await history.save();
  }

  /**
   * Update matching history
   * @param {string} historyId - History ID
   * @param {Object} historyData - Updated data
   * @returns {Promise<Object|null>} Updated history
   */
  async update(historyId, historyData) {
    return await this.model
      .findByIdAndUpdate(historyId, historyData, { new: true })
      .lean();
  }

  /**
   * Delete matching history
   * @param {string} historyId - History ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(historyId) {
    const result = await this.model.findByIdAndDelete(historyId);
    return !!result;
  }

  /**
   * Find histories by score range
   * @param {number} minScore - Minimum score
   * @param {number} maxScore - Maximum score
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching histories in score range
   */
  async findByScoreRange(minScore, maxScore, options = {}) {
    const query = {
      overallScore: { $gte: minScore, $lte: maxScore },
    };

    if (options.candidateId) query.candidateId = options.candidateId;
    if (options.jobId) query.jobId = options.jobId;

    const limit = options.limit || 50;
    return await this.model
      .find(query)
      .sort({ overallScore: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Find histories by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching histories in date range
   */
  async findByDateRange(startDate, endDate, options = {}) {
    const query = {
      matchedAt: { $gte: startDate, $lte: endDate },
    };

    if (options.candidateId) query.candidateId = options.candidateId;
    if (options.jobId) query.jobId = options.jobId;

    const limit = options.limit || 100;
    return await this.model
      .find(query)
      .sort({ matchedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Find top matches for candidate
   * @param {string} candidateId - Candidate ID
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Top matching histories
   */
  async findTopMatchesForCandidate(candidateId, limit = 10) {
    return await this.model
      .find({ candidateId })
      .sort({ overallScore: -1 })
      .limit(limit)
      .populate('jobId', 'title company location')
      .lean();
  }

  /**
   * Find top matches for job
   * @param {string} jobId - Job ID
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Top matching histories
   */
  async findTopMatchesForJob(jobId, limit = 20) {
    return await this.model
      .find({ jobId })
      .sort({ overallScore: -1 })
      .limit(limit)
      .populate('candidateId', 'firstName lastName email')
      .lean();
  }

  /**
   * Get matching statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Statistics data
   */
  async getMatchingStatistics(filters = {}) {
    const query = this.buildQuery(filters);

    const stats = await this.model.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          minScore: { $min: '$overallScore' },
          maxScore: { $max: '$overallScore' },
          scoreDistribution: {
            $bucket: {
              groupBy: '$overallScore',
              boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
              default: 'Other',
              output: { count: { $sum: 1 } },
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalMatches: 0,
        averageScore: 0,
        minScore: 0,
        maxScore: 0,
        scoreDistribution: [],
      }
    );
  }

  /**
   * Get average scores by time period
   * @param {string} period - Time period (day, week, month)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Average scores over time
   */
  async getAverageScoresByPeriod(period, filters = {}) {
    const query = this.buildQuery(filters);

    let groupBy;
    switch (period) {
      case 'day':
        groupBy = {
          $dateToString: { format: '%Y-%m-%d', date: '$matchedAt' },
        };
        break;
      case 'week':
        groupBy = {
          $dateToString: { format: '%Y-%U', date: '$matchedAt' },
        };
        break;
      case 'month':
        groupBy = {
          $dateToString: { format: '%Y-%m', date: '$matchedAt' },
        };
        break;
      default:
        groupBy = {
          $dateToString: { format: '%Y-%m-%d', date: '$matchedAt' },
        };
    }

    return await this.model.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupBy,
          averageScore: { $avg: '$overallScore' },
          totalMatches: { $sum: 1 },
          period: { $first: groupBy },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  /**
   * Clean old matching histories
   * @param {Date} beforeDate - Delete records before this date
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanOldHistories(beforeDate) {
    const result = await this.model.deleteMany({
      matchedAt: { $lt: beforeDate },
    });
    return result.deletedCount;
  }

  /**
   * Get matching trends
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Trend analysis data
   */
  async getMatchingTrends(filters = {}) {
    const query = this.buildQuery(filters);

    const trends = await this.model.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$matchedAt' },
            month: { $month: '$matchedAt' },
          },
          totalMatches: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          scoreRanges: {
            $push: {
              range: {
                $switch: {
                  branches: [
                    {
                      case: { $gte: ['$overallScore', 0.8] },
                      then: 'excellent',
                    },
                    { case: { $gte: ['$overallScore', 0.6] }, then: 'good' },
                    { case: { $gte: ['$overallScore', 0.4] }, then: 'fair' },
                  ],
                  default: 'poor',
                },
              },
              score: '$overallScore',
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return {
      trends,
      summary: {
        totalPeriods: trends.length,
        overallAverage:
          trends.reduce((sum, t) => sum + t.averageScore, 0) / trends.length ||
          0,
      },
    };
  }

  /**
   * Build query from filters
   * @param {Object} filters - Filter options
   * @returns {Object} MongoDB query object
   */
  buildQuery(filters) {
    const query = {};

    if (filters.candidateId) query.candidateId = filters.candidateId;
    if (filters.jobId) query.jobId = filters.jobId;
    if (filters.minScore !== undefined)
      query.overallScore = { $gte: filters.minScore };
    if (filters.maxScore !== undefined) {
      query.overallScore = { ...query.overallScore, $lte: filters.maxScore };
    }
    if (filters.matchType) query.matchType = filters.matchType;
    if (filters.fromDate || filters.toDate) {
      query.matchedAt = {};
      if (filters.fromDate) query.matchedAt.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.matchedAt.$lte = new Date(filters.toDate);
    }

    return query;
  }

  /**
   * Build pagination options
   * @param {Object} pagination - Pagination options
   * @returns {Object} MongoDB options object
   */
  buildPaginationOptions(pagination) {
    const options = {};

    if (pagination.skip !== undefined) options.skip = pagination.skip;
    if (pagination.limit !== undefined) options.limit = pagination.limit;

    const sortBy = pagination.sortBy || 'matchedAt';
    const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
    options.sort = { [sortBy]: sortOrder };

    return options;
  }

  /**
   * Save a new AI matching result
   * @param {Object} matchData - The matching data to save
   * @returns {Promise<Object>} The saved matching record
   */
  async saveMatch(matchData) {
    const match = new this.model({
      matchId: matchData.matchId,
      candidateId: matchData.candidateId,
      jobId: matchData.jobId,
      overallScore: matchData.overallScore,
      skillMatch: matchData.skillMatch,
      experienceMatch: matchData.experienceMatch,
      educationMatch: matchData.educationMatch,
      locationMatch: matchData.locationMatch,
      recommendations: matchData.recommendations,
      confidence: matchData.confidence,
      matchType: matchData.matchType,
      matchedAt: matchData.matchedAt || new Date(),
    });

    return await match.save();
  }

  /**
   * Find matching history with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Matching history with pagination
   */
  async findMatchingHistory(filters = {}, pagination = {}) {
    const query = {};

    // Apply filters
    if (filters.candidateId) {
      query.candidateId = filters.candidateId;
    }
    if (filters.jobId) {
      query.jobId = filters.jobId;
    }
    if (filters.minScore !== undefined) {
      query.overallScore = { ...query.overallScore, $gte: filters.minScore };
    }
    if (filters.maxScore !== undefined) {
      query.overallScore = { ...query.overallScore, $lte: filters.maxScore };
    }
    if (filters.matchType) {
      query.matchType = filters.matchType;
    }
    if (filters.fromDate || filters.toDate) {
      query.matchedAt = {};
      if (filters.fromDate) {
        query.matchedAt.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        query.matchedAt.$lte = new Date(filters.toDate);
      }
    }

    // Pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'matchedAt';
    const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const matches = await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('candidateId', 'firstName lastName email')
      .populate('jobId', 'title company')
      .lean();

    const total = await this.model.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Calculate summary statistics
    const stats = await this.model.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$overallScore' },
          topScore: { $max: '$overallScore' },
          totalMatches: { $sum: 1 },
          matchTypeDistribution: {
            $push: '$matchType',
          },
        },
      },
    ]);

    const summary = stats[0] || {
      averageScore: 0,
      topScore: 0,
      totalMatches: 0,
      matchTypeDistribution: [],
    };

    // Count match types
    const matchTypeCount = {};
    summary.matchTypeDistribution.forEach(type => {
      matchTypeCount[type] = (matchTypeCount[type] || 0) + 1;
    });
    summary.matchTypeDistribution = matchTypeCount;

    return {
      matches,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      averageScore: summary.averageScore,
      topScore: summary.topScore,
    };
  }

  /**
   * Find matches by candidate ID
   * @param {string} candidateId - The candidate ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matches
   */
  async findByCandidateId(candidateId, options = {}) {
    const query = { candidateId };
    const limit = options.limit || 10;
    const sortBy = options.sortBy || 'matchedAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .populate('jobId', 'title company location')
      .lean();
  }

  /**
   * Find matches by job ID
   * @param {string} jobId - The job ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matches
   */
  async findByJobId(jobId, options = {}) {
    const query = { jobId };
    const limit = options.limit || 10;
    const sortBy = options.sortBy || 'matchedAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .populate('candidateId', 'firstName lastName email')
      .lean();
  }

  /**
   * Get match statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Statistics object
   */
  async getMatchStatistics(filters = {}) {
    const query = {};

    // Apply filters
    if (filters.candidateId) query.candidateId = filters.candidateId;
    if (filters.jobId) query.jobId = filters.jobId;
    if (filters.fromDate || filters.toDate) {
      query.matchedAt = {};
      if (filters.fromDate) query.matchedAt.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.matchedAt.$lte = new Date(filters.toDate);
    }

    const stats = await this.model.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          minScore: { $min: '$overallScore' },
          maxScore: { $max: '$overallScore' },
          scoreDistribution: {
            $bucket: {
              groupBy: '$overallScore',
              boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
              default: 'Other',
              output: { count: { $sum: 1 } },
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalMatches: 0,
        averageScore: 0,
        minScore: 0,
        maxScore: 0,
        scoreDistribution: [],
      }
    );
  }
}

module.exports = AiMatchingRepository;
