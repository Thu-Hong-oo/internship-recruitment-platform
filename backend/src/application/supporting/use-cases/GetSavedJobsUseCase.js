/**
 * Get Saved Jobs Use Case
 * Retrieves saved jobs for a candidate with filtering and organization
 */

class GetSavedJobsUseCase {
  constructor(savedJobRepository, jobRepository) {
    this.savedJobRepository = savedJobRepository;
    this.jobRepository = jobRepository;
  }

  async execute(candidateId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        folder,
        priority,
        tags,
        search,
        sortBy = 'savedAt',
        sortOrder = 'desc',
        includeExpired = false,
      } = filters;

      // Build query
      const query = {
        candidateId,
        status: 'saved',
      };

      if (folder) {
        query.folder = folder;
      }

      if (priority) {
        query.priority = priority;
      }

      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      if (search) {
        query.$or = [
          { jobTitle: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [savedJobs, total] = await Promise.all([
        this.savedJobRepository.find(query, { skip, limit, sort }),
        this.savedJobRepository.count(query),
      ]);

      // Enrich saved jobs with current job data
      const enrichedSavedJobs = await Promise.all(
        savedJobs.map(async savedJob => {
          const currentJob = await this.jobRepository.findById(savedJob.jobId);

          return {
            ...savedJob,
            jobCurrentStatus: currentJob?.status || 'unknown',
            jobStillAvailable: currentJob?.status === 'published',
            jobExpired:
              currentJob?.expiresAt &&
              new Date(currentJob.expiresAt) < new Date(),
            jobUpdatedSince: currentJob?.updatedAt > savedJob.savedAt,
            currentJobData: currentJob
              ? {
                  title: currentJob.title,
                  company: currentJob.company?.name,
                  location: currentJob.location,
                  salaryRange: currentJob.salaryRange,
                  expiresAt: currentJob.expiresAt,
                  applicationsCount: currentJob.applicationsCount || 0,
                }
              : null,
          };
        })
      );

      // Filter out expired jobs if requested
      const filteredJobs = includeExpired
        ? enrichedSavedJobs
        : enrichedSavedJobs.filter(job => !job.jobExpired);

      // Group by folders for better organization
      const groupedByFolder = this._groupByFolder(filteredJobs);

      // Get summary statistics
      const stats = await this._getSavedJobsStats(candidateId);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          savedJobs: filteredJobs,
          groupedByFolder,
          pagination: {
            page,
            limit,
            total: filteredJobs.length,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
          stats,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _groupByFolder(savedJobs) {
    const groups = {};

    savedJobs.forEach(job => {
      const folder = job.folder || 'default';
      if (!groups[folder]) {
        groups[folder] = [];
      }
      groups[folder].push(job);
    });

    return Object.entries(groups).map(([folder, jobs]) => ({
      folder,
      count: jobs.length,
      jobs,
      priorities: {
        high: jobs.filter(j => j.priority === 'high').length,
        normal: jobs.filter(j => j.priority === 'normal').length,
        low: jobs.filter(j => j.priority === 'low').length,
      },
    }));
  }

  async _getSavedJobsStats(candidateId) {
    try {
      const [totalSaved, stillAvailable, expired, byPriority, recentlySaved] =
        await Promise.all([
          this.savedJobRepository.count({ candidateId, status: 'saved' }),
          this.savedJobRepository.aggregate([
            { $match: { candidateId, status: 'saved' } },
            {
              $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'job',
              },
            },
            { $match: { 'job.status': 'published' } },
            { $count: 'stillAvailable' },
          ]),
          this.savedJobRepository.aggregate([
            { $match: { candidateId, status: 'saved' } },
            {
              $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'job',
              },
            },
            {
              $match: {
                $or: [
                  { 'job.status': { $ne: 'published' } },
                  { 'job.expiresAt': { $lt: new Date() } },
                ],
              },
            },
            { $count: 'expired' },
          ]),
          this.savedJobRepository.aggregate([
            { $match: { candidateId, status: 'saved' } },
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
          ]),
          this.savedJobRepository.count({
            candidateId,
            status: 'saved',
            savedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          }),
        ]);

      return {
        total: totalSaved,
        stillAvailable: stillAvailable[0]?.stillAvailable || 0,
        expired: expired[0]?.expired || 0,
        byPriority: byPriority.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          { high: 0, normal: 0, low: 0 }
        ),
        recentlySaved,
      };
    } catch (error) {
      console.error('Error getting saved jobs stats:', error);
      return {
        total: 0,
        stillAvailable: 0,
        expired: 0,
        byPriority: { high: 0, normal: 0, low: 0 },
        recentlySaved: 0,
      };
    }
  }
}

module.exports = GetSavedJobsUseCase;
