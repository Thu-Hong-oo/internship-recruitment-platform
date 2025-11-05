const Queue = require('bull');
const Redis = require('ioredis');

class QueueService {
  constructor() {
    this.redisConnected = false;

    try {
      if (process.env.REDIS_URL) {
        const url = new URL(process.env.REDIS_URL);
        this.redisConfig = {
          host: url.hostname,
          port: parseInt(url.port),
          password: url.password,
          username: url.username,
        };
      } else {
        this.redisConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
        };
      }

      this.redis = new Redis(this.redisConfig);

      this.redis.on('connect', () => {
        console.log('QueueService Redis connected successfully');
        this.redisConnected = true;
        this.initializeQueues();
      });

      this.redis.on('error', err => {
        if (err.code === 'ECONNREFUSED') {
          console.warn(
            'QueueService Redis connection refused, queues will not function'
          );
          this.redisConnected = false;
        } else {
          console.error('QueueService Redis Client Error:', err);
        }
      });

      this.queues = new Map();
    } catch (error) {
      console.warn(
        'QueueService Redis initialization failed, queues disabled:',
        error.message
      );
      this.redisConnected = false;
      this.queues = new Map();
    }
  }

  initializeQueues() {
    if (!this.redisConnected) {
      console.warn(
        'QueueService: Skipping queue initialization due to Redis not connected'
      );
      return;
    }

    const redisConfig = this.redisConfig;

    // CV Analysis Queue
    this.queues.set(
      'cv-analysis',
      new Queue('CV Analysis', {
        redis: redisConfig,
      })
    );

    // Email Queue
    this.queues.set(
      'email',
      new Queue('Email', {
        redis: redisConfig,
      })
    );

    // Notification Queue
    this.queues.set(
      'notification',
      new Queue('Notification', {
        redis: redisConfig,
      })
    );

    // Job Matching Queue
    this.queues.set(
      'job-matching',
      new Queue('Job Matching', {
        redis: redisConfig,
      })
    );

    // Data Processing Queue
    this.queues.set(
      'data-processing',
      new Queue('Data Processing', {
        redis: redisConfig,
      })
    );

    this.setupProcessors();
  }

  setupProcessors() {
    // CV Analysis Processor
    this.queues.get('cv-analysis').process('analyze-cv', async job => {
      const { cvId, candidateId } = job.data;
      const GeminiAIService = require('../ai/GeminiAIService');
      const CVRepository = require('../../../../repositories/CVRepository');
      const CVAnalysis = require('../../../models/CVAnalysis');

      try {
        // Update status to in_progress
        await CVRepository.updateAnalysisStatus(cvId, 'in_progress');

        // Get CV content (assuming we have extracted text)
        const cv = await CVRepository.findById(cvId);
        if (!cv) {
          throw new Error('CV not found');
        }

        // Analyze CV using AI
        const analysis = await GeminiAIService.analyzeCV(
          cv.extractedText || ''
        );

        // Save analysis
        const cvAnalysis = new CVAnalysis({
          cvId,
          candidateId,
          extractedText: cv.extractedText,
          skills: analysis.skills || [],
          experience: analysis.experience || [],
          education: analysis.education || [],
          summary: analysis.summary || '',
          confidenceScore: analysis.confidenceScore || 0,
          processedAt: new Date(),
        });

        await cvAnalysis.save();

        // Update CV status
        await CVRepository.updateAnalysisStatus(cvId, 'completed');

        return { success: true, analysisId: cvAnalysis._id };
      } catch (error) {
        await CVRepository.updateAnalysisStatus(cvId, 'failed');
        throw error;
      }
    });

    // Email Processor
    this.queues.get('email').process('send-email', async job => {
      const { to, subject, html, attachments } = job.data;
      const EmailService = require('./EmailService');

      try {
        const result = await EmailService.sendEmail(
          to,
          subject,
          html,
          attachments
        );
        return result;
      } catch (error) {
        throw error;
      }
    });

    // Notification Processor
    this.queues.get('notification').process('send-notification', async job => {
      const { userId, type, title, message, data } = job.data;
      const NotificationRepository = require('../../../../repositories/NotificationRepository');

      try {
        const notification = await NotificationRepository.create({
          userId,
          type,
          title,
          message,
          data,
          isRead: false,
        });

        return notification;
      } catch (error) {
        throw error;
      }
    });

    // Job Matching Processor
    this.queues.get('job-matching').process('match-candidates', async job => {
      const { jobId } = job.data;
      const MatchingService = require('../internal/MatchingService');

      try {
        const matches = await MatchingService.findCandidateMatches(jobId);
        return matches;
      } catch (error) {
        throw error;
      }
    });

    // Data Processing Processor
    this.queues.get('data-processing').process('process-data', async job => {
      const { type, data } = job.data;

      try {
        switch (type) {
          case 'update-stats':
            // Update system statistics
            break;
          case 'cleanup-data':
            // Clean up old data
            break;
          case 'generate-reports':
            // Generate reports
            break;
          default:
            throw new Error('Unknown data processing type');
        }

        return { success: true };
      } catch (error) {
        throw error;
      }
    });
  }

  async addJob(queueName, jobType, data, options = {}) {
    if (!this.redisConnected) {
      console.warn(
        `QueueService: Redis not connected, skipping job ${jobType} in queue ${queueName}`
      );
      return null; // Return null to indicate job not added
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobType, data, {
      attempts: options.attempts || 3,
      backoff: options.backoff || 'exponential',
      delay: options.delay || 0,
      removeOnComplete: options.removeOnComplete || 10,
      removeOnFail: options.removeOnFail || 5,
      ...options,
    });

    return job.id;
  }

  async getJobStatus(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress(),
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  }

  async retryJob(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.retry();
    return true;
  }

  async removeJob(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();
    return true;
  }

  async getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }

  async pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    return true;
  }

  async resumeQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    return true;
  }

  async clearQueue(queueName, type = 'all') {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    switch (type) {
      case 'waiting':
        await queue.clean(0, 'waiting');
        break;
      case 'completed':
        await queue.clean(0, 'completed');
        break;
      case 'failed':
        await queue.clean(0, 'failed');
        break;
      case 'all':
        await queue.empty();
        break;
      default:
        throw new Error('Invalid clear type');
    }

    return true;
  }

  async getFailedJobs(queueName, limit = 10) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failed = await queue.getFailed(0, limit);
    return failed.map(job => ({
      id: job.id,
      data: job.data,
      error: job.failedReason,
      failedAt: new Date(job.finishedOn),
    }));
  }

  async retryFailedJobs(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failed = await queue.getFailed();
    for (const job of failed) {
      await job.retry();
    }

    return failed.length;
  }

  async getJobLogs(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    return {
      logs: job.log,
      progress: job.progress(),
      state: await job.getState(),
    };
  }

  async addBulkJobs(queueName, jobs) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobIds = [];
    for (const jobData of jobs) {
      const job = await queue.add(
        jobData.type,
        jobData.data,
        jobData.options || {}
      );
      jobIds.push(job.id);
    }

    return jobIds;
  }

  async getQueueHealth() {
    const health = {};

    for (const [name, queue] of this.queues) {
      try {
        const stats = await this.getQueueStats(name);
        health[name] = {
          status: 'healthy',
          stats,
        };
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          error: error.message,
        };
      }
    }

    return health;
  }
}

module.exports = new QueueService();
