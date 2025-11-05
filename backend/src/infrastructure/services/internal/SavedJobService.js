const SavedJobRepository = require('../../repositories/SavedJobRepository');
const JobRepository = require('../../repositories/JobRepository');
const UserRepository = require('../../repositories/UserRepository');
const ValidationService = require('./ValidationService');

class SavedJobService {
  constructor() {
    this.savedJobRepository = new SavedJobRepository();
    this.jobRepository = new JobRepository();
    this.userRepository = new UserRepository();
    this.validationService = new ValidationService();
  }

  async saveJob(savedJobData) {
    try {
      // Validate saved job data
      const validation = this.validationService.validateSavedJob(savedJobData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user exists
      const user = await this.userRepository.findById(savedJobData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if job exists
      const job = await this.jobRepository.findById(savedJobData.jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Check if job is already saved by user
      const existingSavedJob = await this.savedJobRepository.findOne({
        userId: savedJobData.userId,
        jobId: savedJobData.jobId,
      });

      if (existingSavedJob) {
        throw new Error('Job already saved by user');
      }

      // Create saved job
      const savedJob = await this.savedJobRepository.create(savedJobData);

      return {
        success: true,
        savedJob: {
          id: savedJob._id,
          userId: savedJob.userId,
          jobId: savedJob.jobId,
          notes: savedJob.notes,
          createdAt: savedJob.createdAt,
        },
        message: 'Job saved successfully',
      };
    } catch (error) {
      throw new Error(`Save job failed: ${error.message}`);
    }
  }

  async getSavedJobById(savedJobId) {
    try {
      const savedJob = await this.savedJobRepository.findById(savedJobId);
      if (!savedJob) {
        throw new Error('Saved job not found');
      }

      return {
        success: true,
        savedJob: {
          id: savedJob._id,
          userId: savedJob.userId,
          jobId: savedJob.jobId,
          notes: savedJob.notes,
          createdAt: savedJob.createdAt,
          updatedAt: savedJob.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get saved job by ID failed: ${error.message}`);
    }
  }

  async updateSavedJob(savedJobId, updateData) {
    try {
      const savedJob = await this.savedJobRepository.findById(savedJobId);
      if (!savedJob) {
        throw new Error('Saved job not found');
      }

      // Validate update data
      const validation = this.validationService.validateSavedJob(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update saved job
      const updatedSavedJob = await this.savedJobRepository.update(
        savedJobId,
        updateData
      );

      return {
        success: true,
        savedJob: {
          id: updatedSavedJob._id,
          userId: updatedSavedJob.userId,
          jobId: updatedSavedJob.jobId,
          notes: updatedSavedJob.notes,
          updatedAt: updatedSavedJob.updatedAt,
        },
        message: 'Saved job updated successfully',
      };
    } catch (error) {
      throw new Error(`Update saved job failed: ${error.message}`);
    }
  }

  async deleteSavedJob(savedJobId) {
    try {
      const savedJob = await this.savedJobRepository.findById(savedJobId);
      if (!savedJob) {
        throw new Error('Saved job not found');
      }

      // Soft delete saved job
      await this.savedJobRepository.softDelete(savedJobId);

      return {
        success: true,
        message: 'Saved job deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete saved job failed: ${error.message}`);
    }
  }

  async getUserSavedJobs(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, search } = filters;
      const skip = (page - 1) * limit;

      const query = { userId };
      if (search) {
        query.$or = [{ notes: { $regex: search, $options: 'i' } }];
      }

      const savedJobs = await this.savedJobRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['jobId'],
      });

      const total = await this.savedJobRepository.count(query);

      return {
        success: true,
        savedJobs: savedJobs.map(savedJob => ({
          id: savedJob._id,
          jobId: savedJob.jobId,
          notes: savedJob.notes,
          createdAt: savedJob.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get user saved jobs failed: ${error.message}`);
    }
  }

  async getAllSavedJobs(filters = {}) {
    try {
      const { page = 1, limit = 20, userId, jobId } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (userId) query.userId = userId;
      if (jobId) query.jobId = jobId;

      const savedJobs = await this.savedJobRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['userId', 'jobId'],
      });

      const total = await this.savedJobRepository.count(query);

      return {
        success: true,
        savedJobs: savedJobs.map(savedJob => ({
          id: savedJob._id,
          userId: savedJob.userId,
          jobId: savedJob.jobId,
          notes: savedJob.notes,
          createdAt: savedJob.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all saved jobs failed: ${error.message}`);
    }
  }

  async getSavedJobStats(userId) {
    try {
      const totalSavedJobs = await this.savedJobRepository.count({ userId });
      const savedJobsWithNotes = await this.savedJobRepository.count({
        userId,
        notes: { $exists: true, $ne: '' },
      });

      return {
        success: true,
        stats: {
          totalSavedJobs,
          savedJobsWithNotes,
        },
      };
    } catch (error) {
      throw new Error(`Get saved job stats failed: ${error.message}`);
    }
  }

  async searchSavedJobs(userId, searchQuery) {
    try {
      const savedJobs = await this.savedJobRepository.find(
        {
          userId,
          $or: [{ notes: { $regex: searchQuery, $options: 'i' } }],
        },
        {
          populate: ['jobId'],
        }
      );

      return {
        success: true,
        savedJobs: savedJobs.map(savedJob => ({
          id: savedJob._id,
          jobId: savedJob.jobId,
          notes: savedJob.notes,
          createdAt: savedJob.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(`Search saved jobs failed: ${error.message}`);
    }
  }

  async getSavedJobNotes(savedJobId) {
    try {
      const savedJob = await this.savedJobRepository.findById(savedJobId);
      if (!savedJob) {
        throw new Error('Saved job not found');
      }

      return {
        success: true,
        notes: savedJob.notes,
      };
    } catch (error) {
      throw new Error(`Get saved job notes failed: ${error.message}`);
    }
  }

  async updateSavedJobNotes(savedJobId, notes) {
    try {
      const savedJob = await this.savedJobRepository.findById(savedJobId);
      if (!savedJob) {
        throw new Error('Saved job not found');
      }

      // Update notes
      const updatedSavedJob = await this.savedJobRepository.update(savedJobId, {
        notes,
      });

      return {
        success: true,
        notes: updatedSavedJob.notes,
        message: 'Notes updated successfully',
      };
    } catch (error) {
      throw new Error(`Update saved job notes failed: ${error.message}`);
    }
  }

  async getSavedJobByUserAndJob(userId, jobId) {
    try {
      const savedJob = await this.savedJobRepository.findOne({
        userId,
        jobId,
      });

      if (!savedJob) {
        return {
          success: true,
          savedJob: null,
          message: 'Job not saved by user',
        };
      }

      return {
        success: true,
        savedJob: {
          id: savedJob._id,
          userId: savedJob.userId,
          jobId: savedJob.jobId,
          notes: savedJob.notes,
          createdAt: savedJob.createdAt,
        },
      };
    } catch (error) {
      throw new Error(`Get saved job by user and job failed: ${error.message}`);
    }
  }

  async getSavedJobTrends() {
    try {
      const trends = await this.savedJobRepository.aggregate([
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      return {
        success: true,
        trends: trends.map(trend => ({
          jobId: trend._id,
          saveCount: trend.count,
        })),
      };
    } catch (error) {
      throw new Error(`Get saved job trends failed: ${error.message}`);
    }
  }

  async getSavedJobRecommendations(userId) {
    try {
      // Get user's saved jobs
      const savedJobs = await this.savedJobRepository.find({ userId });
      const savedJobIds = savedJobs.map(savedJob => savedJob.jobId);

      // Get job recommendations based on saved jobs
      const recommendations = await this.jobRepository.find(
        {
          _id: { $nin: savedJobIds },
          status: 'published',
        },
        {
          limit: 10,
          sort: { createdAt: -1 },
        }
      );

      return {
        success: true,
        recommendations: recommendations.map(job => ({
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          createdAt: job.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get saved job recommendations failed: ${error.message}`);
    }
  }
}

module.exports = new SavedJobService();
