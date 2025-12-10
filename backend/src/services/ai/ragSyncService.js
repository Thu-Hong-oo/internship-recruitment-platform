/**
 * 🔄 RAG Sync Service
 * 
 * Background service để sync jobs và candidates vào ChromaDB index
 * 
 * Features:
 * - Auto-sync on schedule (daily)
 * - Manual sync trigger
 * - Incremental updates
 * - Pre-compute embeddings cho popular jobs
 */

const cron = require('node-cron');
const { logger } = require('../../utils/logger');
const { getJobVectorIndexService } = require('./jobVectorIndexService');
const { getCandidateVectorIndexService } = require('./candidateVectorIndexService');
const Job = require('../../models/Job');
const CandidateProfile = require('../../models/CandidateProfile');

class RAGSyncService {
  constructor() {
    this.jobIndexService = getJobVectorIndexService();
    this.candidateIndexService = getCandidateVectorIndexService();
    this.isRunning = false;
    this.lastSyncTime = null;
  }

  /**
   * Start scheduled sync jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('RAG sync service is already running');
      return;
    }

    // Sync jobs daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      await this.syncJobs();
    }, {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    });

    // Sync candidates daily at 3:30 AM
    cron.schedule('30 3 * * *', async () => {
      await this.syncCandidates();
    }, {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    });

    // Pre-compute embeddings for popular jobs every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.precomputePopularJobEmbeddings();
    }, {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    });

    this.isRunning = true;
    logger.info('✅ RAG sync service started (jobs: 3 AM, candidates: 3:30 AM, popular jobs: every 6h)');
  }

  /**
   * Sync all jobs to ChromaDB
   */
  async syncJobs() {
    try {
      logger.info('🔄 Starting job index sync...');
      const result = await this.jobIndexService.syncAllJobs();
      this.lastSyncTime = new Date();
      logger.info(`✅ Job sync completed: ${result.indexed} indexed, ${result.failed} failed`);
      return result;
    } catch (error) {
      logger.error('❌ Job sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync all candidates to ChromaDB
   */
  async syncCandidates() {
    try {
      logger.info('🔄 Starting candidate index sync...');
      const result = await this.candidateIndexService.syncAllCandidates();
      this.lastSyncTime = new Date();
      logger.info(`✅ Candidate sync completed: ${result.indexed} indexed, ${result.failed} failed`);
      return result;
    } catch (error) {
      logger.error('❌ Candidate sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync single job (when created/updated)
   */
  async syncJob(job) {
    try {
      const result = await this.jobIndexService.indexJob(job);
      if (result) {
        logger.debug(`✅ Synced job ${job._id} to ChromaDB`);
      }
      return result;
    } catch (error) {
      logger.error(`❌ Failed to sync job ${job._id}:`, error);
      return false;
    }
  }

  /**
   * Sync single candidate (when created/updated)
   */
  async syncCandidate(candidate) {
    try {
      const result = await this.candidateIndexService.indexCandidate(candidate);
      if (result) {
        logger.debug(`✅ Synced candidate ${candidate._id} to ChromaDB`);
      }
      return result;
    } catch (error) {
      logger.error(`❌ Failed to sync candidate ${candidate._id}:`, error);
      return false;
    }
  }

  /**
   * Remove job from index (when deleted)
   */
  async removeJob(jobId) {
    try {
      await this.jobIndexService.removeJob(jobId);
      logger.debug(`✅ Removed job ${jobId} from ChromaDB index`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to remove job ${jobId} from index:`, error);
      return false;
    }
  }

  /**
   * Remove candidate from index (when deleted)
   */
  async removeCandidate(candidateId) {
    try {
      await this.candidateIndexService.removeCandidate(candidateId);
      logger.debug(`✅ Removed candidate ${candidateId} from ChromaDB index`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to remove candidate ${candidateId} from index:`, error);
      return false;
    }
  }

  /**
   * Pre-compute embeddings for popular jobs (top 100 by views/applications)
   */
  async precomputePopularJobEmbeddings() {
    try {
      logger.info('🔄 Pre-computing embeddings for popular jobs...');

      // Get popular jobs (top 100 by views or applications)
      const popularJobs = await Job.find({
        status: 'active',
        deadline: { $gte: new Date() }
      })
        .sort({ 
          views: -1,  // Sort by views
          'applications.length': -1  // Then by applications
        })
        .limit(100)
        .select('_id title description requirements location level industry employmentType status createdAt')
        .lean();

      logger.info(`📊 Found ${popularJobs.length} popular jobs to pre-compute`);

      // Index popular jobs
      const result = await this.jobIndexService.batchIndexJobs(popularJobs);

      logger.info(`✅ Pre-computed embeddings for ${result.indexed} popular jobs`);

      return result;
    } catch (error) {
      logger.error('❌ Pre-compute failed:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getStatus() {
    try {
      const jobStats = await this.jobIndexService.getStats();
      const candidateStats = await this.candidateIndexService.getStats();

      return {
        isRunning: this.isRunning,
        lastSyncTime: this.lastSyncTime,
        jobs: {
          initialized: jobStats.initialized,
          indexed: jobStats.count
        },
        candidates: {
          initialized: candidateStats.initialized,
          indexed: candidateStats.count
        }
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      return {
        isRunning: this.isRunning,
        lastSyncTime: this.lastSyncTime,
        error: error.message
      };
    }
  }

  /**
   * Stop sync service
   */
  stop() {
    this.isRunning = false;
    logger.info('RAG sync service stopped');
  }
}

// Singleton instance
let instance = null;

function getRAGSyncService() {
  if (!instance) {
    instance = new RAGSyncService();
  }
  return instance;
}

module.exports = {
  RAGSyncService,
  getRAGSyncService
};

