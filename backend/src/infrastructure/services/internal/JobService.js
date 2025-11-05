const JobRepository = require('../../repositories/JobRepository');
const CompanyRepository = require('../../repositories/CompanyRepository');
const ApplicationRepository = require('../../repositories/ApplicationRepository');
const ValidationService = require('./ValidationService');
const EmailService = require('../external/EmailService');
const QueueService = require('../external/QueueService');

class JobService {
  constructor() {
    this.jobRepository = new JobRepository();
    this.companyRepository = new CompanyRepository();
    this.applicationRepository = new ApplicationRepository();
    this.validationService = new ValidationService();
  }

  async createJobPost(employerId, jobData) {
    try {
      // Validate job data
      const validation = this.validationService.validateJob(jobData);
      if (!validation.isValid) {
        throw new Error(
          `Job validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Get employer's company
      const employer = await this.employerRepository.findById(employerId);
      if (!employer || !employer.companyId) {
        throw new Error('Employer company not found');
      }

      // Create job post
      const jobPostData = {
        ...jobData,
        employerId,
        companyId: employer.companyId,
        status: 'draft',
      };

      const jobPost = await this.jobRepository.create(jobPostData);

      return {
        success: true,
        jobPost: {
          id: jobPost._id,
          title: jobPost.title,
          status: jobPost.status,
          createdAt: jobPost.createdAt,
        },
        message: 'Job post created successfully',
      };
    } catch (error) {
      throw new Error(`Job post creation failed: ${error.message}`);
    }
  }

  async getAllJobPosts(filters = {}) {
    try {
      const { page = 1, limit = 10, ...queryFilters } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (queryFilters.status) query.status = queryFilters.status;
      if (queryFilters.employmentType)
        query.employmentType = queryFilters.employmentType;
      if (queryFilters.experienceLevel)
        query.experienceLevel = queryFilters.experienceLevel;
      if (queryFilters.location)
        query['location.city'] = {
          $regex: queryFilters.location,
          $options: 'i',
        };
      if (queryFilters.skills)
        query.skills = { $in: queryFilters.skills.split(',') };

      const jobPosts = await this.jobRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['employerId', 'companyId'],
      });

      const total = await this.jobRepository.count(query);

      return {
        success: true,
        jobPosts: jobPosts.map(job => ({
          id: job._id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          skills: job.skills,
          status: job.status,
          applicationDeadline: job.applicationDeadline,
          employer: job.employerId,
          company: job.companyId,
          createdAt: job.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all job posts failed: ${error.message}`);
    }
  }

  async getJobPostById(jobId) {
    try {
      const jobPost = await this.jobRepository.findById(jobId, [
        'employerId',
        'companyId',
      ]);
      if (!jobPost) {
        throw new Error('Job post not found');
      }

      return {
        success: true,
        jobPost: {
          id: jobPost._id,
          title: jobPost.title,
          description: jobPost.description,
          requirements: jobPost.requirements,
          responsibilities: jobPost.responsibilities,
          benefits: jobPost.benefits,
          employmentType: jobPost.employmentType,
          experienceLevel: jobPost.experienceLevel,
          location: jobPost.location,
          salaryMin: jobPost.salaryMin,
          salaryMax: jobPost.salaryMax,
          currency: jobPost.currency,
          skills: jobPost.skills,
          status: jobPost.status,
          applicationDeadline: jobPost.applicationDeadline,
          employer: jobPost.employerId,
          company: jobPost.companyId,
          createdAt: jobPost.createdAt,
          updatedAt: jobPost.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get job post by ID failed: ${error.message}`);
    }
  }

  async updateJobPost(jobId, employerId, updates) {
    try {
      // Verify ownership
      const jobPost = await this.jobRepository.findById(jobId);
      if (!jobPost || jobPost.employerId.toString() !== employerId) {
        throw new Error('Job post not found or access denied');
      }

      // Validate updates
      const validation = this.validationService.validateJob(updates);
      if (!validation.isValid) {
        throw new Error(
          `Job validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Update job post
      const updatedJobPost = await this.jobRepository.update(jobId, updates);

      return {
        success: true,
        jobPost: {
          id: updatedJobPost._id,
          title: updatedJobPost.title,
          status: updatedJobPost.status,
        },
        message: 'Job post updated successfully',
      };
    } catch (error) {
      throw new Error(`Job post update failed: ${error.message}`);
    }
  }

  async deleteJobPost(jobId, employerId) {
    try {
      // Verify ownership
      const jobPost = await this.jobRepository.findById(jobId);
      if (!jobPost || jobPost.employerId.toString() !== employerId) {
        throw new Error('Job post not found or access denied');
      }

      // Soft delete job post
      await this.jobRepository.softDelete(jobId);

      return {
        success: true,
        message: 'Job post deleted successfully',
      };
    } catch (error) {
      throw new Error(`Job post deletion failed: ${error.message}`);
    }
  }

  async publishJobPost(jobId, employerId) {
    try {
      // Verify ownership
      const jobPost = await this.jobRepository.findById(jobId);
      if (!jobPost || jobPost.employerId.toString() !== employerId) {
        throw new Error('Job post not found or access denied');
      }

      // Update status to published
      const updatedJobPost = await this.jobRepository.update(jobId, {
        status: 'published',
      });

      // Queue job matching
      await QueueService.addJob('job-matching', 'match-candidates', { jobId });

      return {
        success: true,
        jobPost: {
          id: updatedJobPost._id,
          title: updatedJobPost.title,
          status: updatedJobPost.status,
        },
        message: 'Job post published successfully',
      };
    } catch (error) {
      throw new Error(`Job post publication failed: ${error.message}`);
    }
  }

  async closeJobPost(jobId, employerId) {
    try {
      // Verify ownership
      const jobPost = await this.jobRepository.findById(jobId);
      if (!jobPost || jobPost.employerId.toString() !== employerId) {
        throw new Error('Job post not found or access denied');
      }

      // Update status to closed
      const updatedJobPost = await this.jobRepository.update(jobId, {
        status: 'closed',
      });

      return {
        success: true,
        jobPost: {
          id: updatedJobPost._id,
          title: updatedJobPost.title,
          status: updatedJobPost.status,
        },
        message: 'Job post closed successfully',
      };
    } catch (error) {
      throw new Error(`Job post closure failed: ${error.message}`);
    }
  }

  async getEmployerJobPosts(employerId, filters = {}) {
    try {
      const { page = 1, limit = 10, status } = filters;
      const skip = (page - 1) * limit;

      const query = { employerId };
      if (status) query.status = status;

      const jobPosts = await this.jobRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['companyId'],
      });

      const total = await this.jobRepository.count(query);

      return {
        success: true,
        jobPosts: jobPosts.map(job => ({
          id: job._id,
          title: job.title,
          status: job.status,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          location: job.location,
          applicationDeadline: job.applicationDeadline,
          company: job.companyId,
          createdAt: job.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get employer job posts failed: ${error.message}`);
    }
  }

  async searchJobPosts(filters = {}) {
    try {
      const { page = 1, limit = 10, q, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      // Build search query
      const query = { status: 'published' };

      if (q) {
        query.$text = { $search: q };
      }

      if (otherFilters.employmentType)
        query.employmentType = otherFilters.employmentType;
      if (otherFilters.experienceLevel)
        query.experienceLevel = otherFilters.experienceLevel;
      if (otherFilters.location)
        query['location.city'] = {
          $regex: otherFilters.location,
          $options: 'i',
        };
      if (otherFilters.skills)
        query.skills = { $in: otherFilters.skills.split(',') };

      const jobPosts = await this.jobRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['employerId', 'companyId'],
      });

      const total = await this.jobRepository.count(query);

      return {
        success: true,
        jobPosts: jobPosts.map(job => ({
          id: job._id,
          title: job.title,
          description: job.description,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          skills: job.skills,
          applicationDeadline: job.applicationDeadline,
          employer: job.employerId,
          company: job.companyId,
          createdAt: job.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Search job posts failed: ${error.message}`);
    }
  }

  async getJobPostStats(jobId, employerId) {
    try {
      // Verify ownership
      const jobPost = await this.jobRepository.findById(jobId);
      if (!jobPost || jobPost.employerId.toString() !== employerId) {
        throw new Error('Job post not found or access denied');
      }

      // Get application stats
      const applicationStats =
        await this.applicationRepository.getApplicationStats(jobId);

      return {
        success: true,
        stats: {
          totalApplications: applicationStats.reduce(
            (sum, stat) => sum + stat.count,
            0
          ),
          applicationsByStatus: applicationStats,
          jobPost: {
            id: jobPost._id,
            title: jobPost.title,
            status: jobPost.status,
            createdAt: jobPost.createdAt,
          },
        },
      };
    } catch (error) {
      throw new Error(`Get job post stats failed: ${error.message}`);
    }
  }
}

module.exports = new JobService();


