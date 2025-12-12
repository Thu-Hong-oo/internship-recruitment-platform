/**
 * 🗄️ Job Vector Index Service
 * 
 * Index jobs vào ChromaDB để enable fast vector search
 * 
 * Benefits:
 * - Query nhanh hơn (milliseconds vs 350ms)
 * - Scale tốt (hàng nghìn jobs)
 * - Metadata filtering (location, level, industry)
 * 
 * Strategy:
 * - Index jobs khi được tạo/cập nhật
 * - Background sync job để update index
 * - Fallback về realtime embedding nếu ChromaDB unavailable
 */

const { ChromaClient } = require('chromadb');
const { getSentenceBertService } = require('./sentenceBertService');
const { logger } = require('../../utils/logger');
const Job = require('../../models/Job');

class JobVectorIndexService {
  constructor() {
    this.client = null;
    this.jobCollection = null;
    this.collectionName = 'jobs';
    this.sentenceBert = getSentenceBertService();
    this.initialized = false;
  }

  /**
   * Initialize ChromaDB client and collection
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      // ChromaDB connection logic:
      // 1. If CHROMA_URL is set → use it (external ChromaDB server)
      // 2. If CHROMA_URL is not set → use embedded server on port 8001 (for App Runner)
      // 3. For localhost → default to http://localhost:8000 (requires docker-compose)
      let chromaUrl;
      if (process.env.CHROMADB_URL || process.env.CHROMA_URL) {
        chromaUrl = process.env.CHROMADB_URL || process.env.CHROMA_URL;
      } else if (process.env.NODE_ENV === 'production' || process.env.AWS_EXECUTION_ENV) {
        // Production/App Runner: use embedded server (runs in same container)
        chromaUrl = 'http://localhost:8001';
      } else {
        // Local development: default to docker-compose ChromaDB
        chromaUrl = 'http://localhost:8000';
      }
      
      try {
        this.client = new ChromaClient({
          path: chromaUrl,
        });

        logger.info('🔗 Connecting to ChromaDB for job indexing...');

        // Get or create collection
        try {
          this.jobCollection = await this.client.getCollection({
            name: this.collectionName,
          });
          logger.info(`✅ Connected to existing job collection: ${this.collectionName}`);
        } catch (error) {
          // Collection doesn't exist, create it
          this.jobCollection = await this.client.createCollection({
            name: this.collectionName,
            metadata: {
              description: 'Job postings for semantic search',
              createdAt: new Date().toISOString(),
              version: '1.0',
            },
          });
          logger.info(`✅ Created new job collection: ${this.collectionName}`);
        }

        this.initialized = true;
        return true;
      } catch (error) {
        logger.warn('⚠️ ChromaDB not available for job indexing, will use realtime embedding:', error.message);
        this.initialized = false;
        return false;
      }
    } catch (error) {
      logger.error('❌ Job vector index initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Index a job into ChromaDB
   * 
   * @param {Object} job - Job posting object
   * @returns {Promise<boolean>} Success status
   */
  async indexJob(job) {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false; // ChromaDB not available
        }
      }

      const jobId = job._id?.toString() || job.id?.toString();
      if (!jobId) {
        logger.warn('Cannot index job without ID');
        return false;
      }

      // Build text representation for embedding
      const jobText = this._buildJobText(job);

      // Generate embedding
      const embedding = await this.sentenceBert.encode(jobText);

      // Prepare metadata
      const metadata = {
        jobId: jobId,
        title: String(job.title || ''),
        location: String(job.location || ''),
        level: String(job.level || ''),
        industry: String(job.industry || ''),
        employmentType: String(job.employmentType || ''),
        status: String(job.status || 'active'),
        createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
      };

      // Add or update in ChromaDB
      await this.jobCollection.upsert({
        ids: [jobId],
        embeddings: [embedding],
        metadatas: [metadata],
      });

      logger.debug(`✅ Indexed job ${jobId} in ChromaDB`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to index job ${job._id}:`, error);
      return false;
    }
  }

  /**
   * Remove job from index
   */
  async removeJob(jobId) {
    try {
      if (!this.initialized) {
        return false;
      }

      await this.jobCollection.delete({
        ids: [jobId.toString()],
      });

      logger.debug(`✅ Removed job ${jobId} from ChromaDB index`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to remove job ${jobId} from index:`, error);
      return false;
    }
  }

  /**
   * Search similar jobs using vector search
   * 
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Similar jobs with scores
   */
  async searchSimilarJobs(queryEmbedding, options = {}) {
    try {
      if (!this.initialized) {
        return [];
      }

      const {
        topK = 100,
        filters = {},
        minScore = 0.7
      } = options;

      // Build where clause for metadata filtering
      const where = {};
      if (filters.location) {
        where.location = { $eq: filters.location };
      }
      if (filters.level) {
        where.level = { $eq: filters.level };
      }
      if (filters.industry) {
        where.industry = { $eq: filters.industry };
      }
      if (filters.status) {
        where.status = { $eq: filters.status };
      } else {
        where.status = { $eq: 'active' }; // Default: only active jobs
      }

      // Query ChromaDB
      const results = await this.jobCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: Object.keys(where).length > 0 ? where : undefined,
      });

      // Format results
      const jobs = [];
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const distance = results.distances?.[0]?.[i] || 0;
          const similarity = 1 - distance; // Convert distance to similarity

          if (similarity >= minScore) {
            jobs.push({
              jobId: results.ids[0][i],
              similarity: similarity,
              distance: distance,
              metadata: results.metadatas?.[0]?.[i] || {}
            });
          }
        }
      }

      // Sort by similarity descending
      jobs.sort((a, b) => b.similarity - a.similarity);

      return jobs;
    } catch (error) {
      logger.error('❌ Vector search failed:', error);
      return [];
    }
  }

  /**
   * Batch index multiple jobs
   */
  async batchIndexJobs(jobs) {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, indexed: 0, failed: jobs.length };
        }
      }

      const ids = [];
      const embeddings = [];
      const metadatas = [];

      // Process in batches to avoid memory issues
      const batchSize = 50;
      let indexed = 0;
      let failed = 0;

      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);

        for (const job of batch) {
          try {
            const jobId = job._id?.toString() || job.id?.toString();
            if (!jobId) continue;

            const jobText = this._buildJobText(job);
            const embedding = await this.sentenceBert.encode(jobText);

            ids.push(jobId);
            embeddings.push(embedding);
            metadatas.push({
              jobId: jobId,
              title: String(job.title || ''),
              location: String(job.location || ''),
              level: String(job.level || ''),
              industry: String(job.industry || ''),
              status: String(job.status || 'active'),
            });
          } catch (error) {
            logger.error(`Failed to process job ${job._id} for indexing:`, error);
            failed++;
          }
        }

        // Upsert batch
        if (ids.length > 0) {
          try {
            await this.jobCollection.upsert({
              ids,
              embeddings,
              metadatas,
            });
            indexed += ids.length;
            logger.info(`✅ Batch indexed ${ids.length} jobs`);
          } catch (error) {
            logger.error('Batch indexing failed:', error);
            failed += ids.length;
          }

          // Clear batch arrays
          ids.length = 0;
          embeddings.length = 0;
          metadatas.length = 0;
        }
      }

      return {
        success: true,
        indexed,
        failed,
        total: jobs.length
      };
    } catch (error) {
      logger.error('❌ Batch indexing failed:', error);
      return {
        success: false,
        indexed: 0,
        failed: jobs.length,
        total: jobs.length
      };
    }
  }

  /**
   * Sync all active jobs to ChromaDB (background job)
   */
  async syncAllJobs() {
    try {
      logger.info('🔄 Starting job index sync...');

      const activeJobs = await Job.find({
        status: 'active',
        deadline: { $gte: new Date() }
      })
        .select('_id title description requirements location level industry employmentType status createdAt')
        .lean();

      logger.info(`📊 Found ${activeJobs.length} active jobs to index`);

      const result = await this.batchIndexJobs(activeJobs);

      logger.info(`✅ Job sync completed: ${result.indexed} indexed, ${result.failed} failed`);

      return result;
    } catch (error) {
      logger.error('❌ Job sync failed:', error);
      throw error;
    }
  }

  /**
   * Build text representation of job for embedding
   */
  _buildJobText(job) {
    const parts = [
      job.title || '',
      job.description || '',
      job.requirements || '',
      job.skills?.map(s => s.name || s).join(' ') || '',
      job.industry || '',
      job.level || '',
      job.employmentType || ''
    ].filter(p => p.length > 0);

    return parts.join(' ').substring(0, 2000); // Limit length
  }

  /**
   * Get index stats
   */
  async getStats() {
    try {
      if (!this.initialized) {
        return { initialized: false, count: 0 };
      }

      const count = await this.jobCollection.count();
      return {
        initialized: true,
        count: count,
        collectionName: this.collectionName
      };
    } catch (error) {
      logger.error('Failed to get index stats:', error);
      return { initialized: false, count: 0 };
    }
  }
}

// Singleton instance
let instance = null;

function getJobVectorIndexService() {
  if (!instance) {
    instance = new JobVectorIndexService();
  }
  return instance;
}

module.exports = {
  JobVectorIndexService,
  getJobVectorIndexService
};

