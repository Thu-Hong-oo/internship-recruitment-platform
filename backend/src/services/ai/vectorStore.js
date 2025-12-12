const { ChromaClient } = require('chromadb');
const { logger } = require('../../utils/logger');
const { getSentenceBertService } = require('./sentenceBertService');
const Job = require('../../models/Job');

/**
 * Lightweight wrapper around Chroma for job vectors.
 * - Pre-compute job embeddings once at startup (or lazily on first call)
 * - Query top-N jobs by embedding
 */
class VectorStore {
  constructor() {
    // ChromaDB connection logic:
    // 1. If CHROMA_URL is set → use it (external ChromaDB server)
    // 2. If CHROMA_URL is not set → use embedded server on port 8001 (for App Runner)
    // 3. For localhost → default to http://localhost:8000 (requires docker-compose)
    let chromaUrl;
    if (process.env.CHROMA_URL) {
      // Use provided CHROMA_URL (external server or docker-compose)
      chromaUrl = process.env.CHROMA_URL;
      logger.info(`Using ChromaDB URL from CHROMA_URL: ${chromaUrl}`);
    } else if (process.env.NODE_ENV === 'production' || 
               process.env.AWS_EXECUTION_ENV || 
               process.env.AWS_LAMBDA_FUNCTION_NAME ||
               process.env._?.includes('apprunner')) {
      // Production/App Runner: use embedded server (runs in same container)
      chromaUrl = 'http://localhost:8001';
      logger.info('Using ChromaDB embedded server on port 8001 (production mode)');
    } else {
      // Local development: default to docker-compose ChromaDB
      chromaUrl = 'http://localhost:8000';
      logger.info('Using ChromaDB on port 8000 (local development)');
    }
    
    this.client = new ChromaClient({ path: chromaUrl });
    this.collectionName = process.env.CHROMA_COLLECTION_JOBS || 'jobs';
    this.collectionPromise = null;
    this.isPrecomputed = false;
    this.chromaUrl = chromaUrl; // Store for debugging
  }

  async _getCollection() {
    if (this.collectionPromise) return this.collectionPromise;
    
    // Retry logic for embedded server (may need time to start)
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        this.collectionPromise = this.client.getOrCreateCollection({
          name: this.collectionName,
          metadata: { description: 'Job embeddings for fast candidate matching' },
        });
        return this.collectionPromise;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          logger.warn(`Failed to connect to ChromaDB at ${this.chromaUrl}, retrying... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }
    }
    
    // If all retries failed, throw error
    logger.error(`Failed to connect to ChromaDB after retries: ${lastError?.message || lastError}`);
    throw lastError || new Error(`Failed to connect to ChromaDB at ${this.chromaUrl}`);
  }

  _buildJobText(job) {
    const skills =
      Array.isArray(job.skills) && job.skills.length > 0
        ? job.skills
            .map(s => (typeof s === 'string' ? s : s.name || s.title || ''))
            .join(' ')
        : '';
    return [
      job.title || '',
      job.requirements || '',
      job.description || '',
      skills,
      job.industry || '',
      job.level || '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .substring(0, 2000);
  }

  async precomputeActiveJobs() {
    try {
      const collection = await this._getCollection();
      const jobs = await Job.find({ status: 'active' }).lean();
      if (!jobs.length) {
        logger.warn('⚠️ No active jobs to precompute');
        return;
      }

      // Chuẩn bị text và lọc job hợp lệ, loại trùng ID
      const seenIds = new Set();
      const texts = [];
      const validJobs = [];

      for (const job of jobs) {
        if (!job?._id) continue;
        const id = job._id.toString();
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const text = [
          job.title || '',
          job.description || '',
          job.requirements || '',
          Array.isArray(job.skills) ? job.skills.map(s => (typeof s === 'string' ? s : s?.name || s?.title || '')).join(' ') : '',
          job.companyName || job.employerName || '',
        ]
          .join(' ')
          .trim();

        // Chroma reject text quá ngắn
        if (text.length <= 10) continue;

        validJobs.push(job);
        texts.push(text);
      }

      if (!texts.length) {
        logger.warn('⚠️ No valid job texts to embed');
        return;
      }

      const sbert = getSentenceBertService();
      logger.info(`Encoding ${texts.length} jobs for Chroma precompute...`);
      const embeddings = await sbert.encodeBatch(texts);

      // Làm sạch embedding lỗi (null/NaN/len khác 768)
      const cleanData = [];
      for (let i = 0; i < embeddings.length; i++) {
        const emb = embeddings[i];
        const isValidArray =
          Array.isArray(emb) &&
          emb.length === 768 &&
          emb.every(x => typeof x === 'number' && !Number.isNaN(x));

        if (!isValidArray) continue;

        const job = validJobs[i];
        cleanData.push({
          id: job._id.toString(),
          embedding: emb,
          metadata: {
            title: job.title || 'Untitled',
            company: job.companyName || job.employerName || '',
            salaryMin: Number(job.salaryMin || 0),
            salaryMax: Number(job.salaryMax || 0),
            location: job.location?.city || job.location || 'Hà Nội',
            yearsExp: Number(job.yearsOfExperience || job.experience || 0),
            jobType: job.jobType || job.employmentType || 'fulltime',
            industry: job.industry || '',
            level: job.level || '',
          },
        });
      }

      if (!cleanData.length) {
        logger.warn('⚠️ No valid embeddings after cleaning');
        return;
      }

      // Chia nhỏ batch để tránh 422
      const BATCH_SIZE = 50;
      for (let i = 0; i < cleanData.length; i += BATCH_SIZE) {
        const batch = cleanData.slice(i, i + BATCH_SIZE);
        await collection.upsert({
          ids: batch.map(d => d.id),
          embeddings: batch.map(d => d.embedding),
          metadatas: batch.map(d => d.metadata),
        });
        logger.info(
          `✅ Uploaded batch ${i / BATCH_SIZE + 1}/${Math.ceil(cleanData.length / BATCH_SIZE)}`
        );
      }

      this.isPrecomputed = true;
      logger.info(
        `✅ Pre-computed ${cleanData.length} jobs into Chroma collection "${this.collectionName}"`
      );
    } catch (err) {
      const detail = err?.response?.data || err?.message || err;
      logger.error('❌ Failed to precompute jobs into Chroma:', detail, {
        collection: this.collectionName,
        batchError: true,
      });
      throw err;
    }
  }

  async ensurePrecomputed() {
    if (this.isPrecomputed) return;
    await this.precomputeActiveJobs();
  }

  /**
   * Query top N by embedding
   * @param {number[]} embedding
   * @param {number} nResults
   */
  async queryTopN(embedding, nResults = 60) {
    const collection = await this._getCollection();
    return collection.query({
      queryEmbeddings: [embedding],
      nResults,
      // Chroma 1.8+ tự trả ids, chỉ include field được phép
      // Include embeddings để fallback tính cos-sim nếu distances rỗng
      include: ['metadatas', 'distances', 'embeddings'],
    });
  }
}

let instance = null;
function getVectorStore() {
  if (!instance) instance = new VectorStore();
  return instance;
}

module.exports = {
  getVectorStore,
};

