/**
 * 🗄️ Candidate Vector Index Service
 * 
 * Index candidates vào ChromaDB để enable fast vector search
 * 
 * Benefits:
 * - Query nhanh hơn (milliseconds vs 350ms)
 * - Scale tốt (hàng nghìn candidates)
 * - Metadata filtering (location, availability, experience level)
 */

const { ChromaClient } = require('chromadb');
const { getSentenceBertService } = require('./sentenceBertService');
const { logger } = require('../../utils/logger');
const CandidateProfile = require('../../models/CandidateProfile');

class CandidateVectorIndexService {
  constructor() {
    this.client = null;
    this.candidateCollection = null;
    this.collectionName = 'candidates';
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

      const chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000';
      
      try {
        this.client = new ChromaClient({
          path: chromaUrl,
        });

        logger.info('🔗 Connecting to ChromaDB for candidate indexing...');

        // Get or create collection
        try {
          this.candidateCollection = await this.client.getCollection({
            name: this.collectionName,
          });
          logger.info(`✅ Connected to existing candidate collection: ${this.collectionName}`);
        } catch (error) {
          // Collection doesn't exist, create it
          this.candidateCollection = await this.client.createCollection({
            name: this.collectionName,
            metadata: {
              description: 'Candidate profiles for semantic search',
              createdAt: new Date().toISOString(),
              version: '1.0',
            },
          });
          logger.info(`✅ Created new candidate collection: ${this.collectionName}`);
        }

        this.initialized = true;
        return true;
      } catch (error) {
        logger.warn('⚠️ ChromaDB not available for candidate indexing, will use realtime embedding:', error.message);
        this.initialized = false;
        return false;
      }
    } catch (error) {
      logger.error('❌ Candidate vector index initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Index a candidate into ChromaDB
   */
  async indexCandidate(candidate) {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      const candidateId = candidate._id?.toString() || candidate.id?.toString();
      if (!candidateId) {
        logger.warn('Cannot index candidate without ID');
        return false;
      }

      // Build text representation
      const candidateText = this._buildCandidateText(candidate);

      // Generate embedding
      const embedding = await this.sentenceBert.encode(candidateText);

      // Calculate total years of experience
      const totalYears = this._calculateTotalYears(candidate.cv?.experience || candidate.experience);

      // Prepare metadata
      const metadata = {
        candidateId: candidateId,
        fullName: String(candidate.fullName || candidate.cv?.fullName || ''),
        location: String(candidate.location || candidate.cv?.location || ''),
        availability: String(candidate.availability || 'available'),
        yearsExperience: String(totalYears),
        updatedAt: candidate.updatedAt ? new Date(candidate.updatedAt).toISOString() : new Date().toISOString(),
      };

      // Add or update in ChromaDB
      await this.candidateCollection.upsert({
        ids: [candidateId],
        embeddings: [embedding],
        metadatas: [metadata],
      });

      logger.debug(`✅ Indexed candidate ${candidateId} in ChromaDB`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to index candidate ${candidate._id}:`, error);
      return false;
    }
  }

  /**
   * Remove candidate from index
   */
  async removeCandidate(candidateId) {
    try {
      if (!this.initialized) {
        return false;
      }

      await this.candidateCollection.delete({
        ids: [candidateId.toString()],
      });

      logger.debug(`✅ Removed candidate ${candidateId} from ChromaDB index`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to remove candidate ${candidateId} from index:`, error);
      return false;
    }
  }

  /**
   * Search similar candidates using vector search
   */
  async searchSimilarCandidates(queryEmbedding, options = {}) {
    try {
      if (!this.initialized) {
        return [];
      }

      const {
        topK = 100,
        filters = {},
        minScore = 0.7
      } = options;

      // Build where clause
      const where = {};
      if (filters.location) {
        where.location = { $eq: filters.location };
      }
      if (filters.availability) {
        where.availability = { $in: Array.isArray(filters.availability) ? filters.availability : [filters.availability] };
      }

      // Query ChromaDB
      const results = await this.candidateCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: Object.keys(where).length > 0 ? where : undefined,
      });

      // Format results
      const candidates = [];
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const distance = results.distances?.[0]?.[i] || 0;
          const similarity = 1 - distance;

          if (similarity >= minScore) {
            candidates.push({
              candidateId: results.ids[0][i],
              similarity: similarity,
              distance: distance,
              metadata: results.metadatas?.[0]?.[i] || {}
            });
          }
        }
      }

      // Sort by similarity descending
      candidates.sort((a, b) => b.similarity - a.similarity);

      return candidates;
    } catch (error) {
      logger.error('❌ Candidate vector search failed:', error);
      return [];
    }
  }

  /**
   * Batch index multiple candidates
   */
  async batchIndexCandidates(candidates) {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, indexed: 0, failed: candidates.length };
        }
      }

      const ids = [];
      const embeddings = [];
      const metadatas = [];

      const batchSize = 50;
      let indexed = 0;
      let failed = 0;

      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);

        for (const candidate of batch) {
          try {
            const candidateId = candidate._id?.toString() || candidate.id?.toString();
            if (!candidateId) continue;

            const candidateText = this._buildCandidateText(candidate);
            const embedding = await this.sentenceBert.encode(candidateText);
            const totalYears = this._calculateTotalYears(candidate.cv?.experience || candidate.experience);

            ids.push(candidateId);
            embeddings.push(embedding);
            metadatas.push({
              candidateId: candidateId,
              fullName: String(candidate.fullName || candidate.cv?.fullName || ''),
              location: String(candidate.location || candidate.cv?.location || ''),
              availability: String(candidate.availability || 'available'),
              yearsExperience: String(totalYears),
            });
          } catch (error) {
            logger.error(`Failed to process candidate ${candidate._id} for indexing:`, error);
            failed++;
          }
        }

        // Upsert batch
        if (ids.length > 0) {
          try {
            await this.candidateCollection.upsert({
              ids,
              embeddings,
              metadatas,
            });
            indexed += ids.length;
            logger.info(`✅ Batch indexed ${ids.length} candidates`);
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
        total: candidates.length
      };
    } catch (error) {
      logger.error('❌ Batch candidate indexing failed:', error);
      return {
        success: false,
        indexed: 0,
        failed: candidates.length,
        total: candidates.length
      };
    }
  }

  /**
   * Sync all active candidates to ChromaDB
   */
  async syncAllCandidates() {
    try {
      logger.info('🔄 Starting candidate index sync...');

      const activeCandidates = await CandidateProfile.find({
        availability: { $in: ['available', 'open_to_opportunities'] }
      })
        .populate('cv')
        .select('_id fullName email location cv availability summary experience skills projects education updatedAt')
        .lean();

      logger.info(`📊 Found ${activeCandidates.length} active candidates to index`);

      const result = await this.batchIndexCandidates(activeCandidates);

      logger.info(`✅ Candidate sync completed: ${result.indexed} indexed, ${result.failed} failed`);

      return result;
    } catch (error) {
      logger.error('❌ Candidate sync failed:', error);
      throw error;
    }
  }

  /**
   * Build text representation of candidate for embedding
   */
  _buildCandidateText(candidate) {
    const cv = candidate.cv || candidate;
    const parts = [
      candidate.fullName || cv.fullName || '',
      candidate.summary || cv.summary || '',
      candidate.experience?.map(e => `${e.position} ${e.description || ''}`).join(' ') || 
        cv.experience?.map(e => `${e.position} ${e.description || ''}`).join(' ') || '',
      candidate.skills?.map(s => s.name || s).join(' ') || 
        cv.skills?.map(s => s.name || s).join(' ') || '',
      candidate.projects?.map(p => `${p.title} ${p.description || ''}`).join(' ') ||
        cv.projects?.map(p => `${p.title} ${p.description || ''}`).join(' ') || '',
      candidate.education?.map(e => `${e.degree} ${e.major || ''}`).join(' ') ||
        cv.education?.map(e => `${e.degree} ${e.major || ''}`).join(' ') || ''
    ].filter(p => p.length > 0);

    return parts.join(' ').substring(0, 2000);
  }

  /**
   * Calculate total years of experience
   */
  _calculateTotalYears(experience) {
    if (!experience || !Array.isArray(experience)) {
      return 0;
    }

    let totalYears = 0;
    for (const exp of experience) {
      if (exp.duration) {
        const years = this._parseDuration(exp.duration);
        totalYears += years;
      }
    }

    return Math.round(totalYears * 10) / 10;
  }

  /**
   * Parse duration string to years
   */
  _parseDuration(duration) {
    if (!duration) return 0;
    
    const lower = duration.toLowerCase();
    let years = 0;

    const yearMatch = lower.match(/(\d+\.?\d*)\s*(year|yr|năm)/);
    const monthMatch = lower.match(/(\d+)\s*(month|tháng)/);

    if (yearMatch) {
      years += parseFloat(yearMatch[1]);
    }

    if (monthMatch) {
      years += parseInt(monthMatch[1]) / 12;
    }

    return years;
  }

  /**
   * Get index stats
   */
  async getStats() {
    try {
      if (!this.initialized) {
        return { initialized: false, count: 0 };
      }

      const count = await this.candidateCollection.count();
      return {
        initialized: true,
        count: count,
        collectionName: this.collectionName
      };
    } catch (error) {
      logger.error('Failed to get candidate index stats:', error);
      return { initialized: false, count: 0 };
    }
  }
}

// Singleton instance
let instance = null;

function getCandidateVectorIndexService() {
  if (!instance) {
    instance = new CandidateVectorIndexService();
  }
  return instance;
}

module.exports = {
  CandidateVectorIndexService,
  getCandidateVectorIndexService
};

