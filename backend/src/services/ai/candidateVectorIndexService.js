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
        minScore = 0.2  // Giảm từ 0.7 xuống 0.2 để tìm được nhiều candidates hơn
      } = options;

      // Build where clause
      const where = {};
      if (filters.location) {
        where.location = { $eq: filters.location };
      }
      if (filters.availability) {
        where.availability = { $in: Array.isArray(filters.availability) ? filters.availability : [filters.availability] };
      }

      // Query ChromaDB - include embeddings để tính cosine similarity trực tiếp
      const results = await this.candidateCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: Object.keys(where).length > 0 ? where : undefined,
        include: ['metadatas', 'distances', 'embeddings'], // Include embeddings để tính cosine similarity
      });

      logger.debug('🔍 Vector search query results:', {
        hasIds: !!results.ids,
        idsLength: results.ids?.[0]?.length || 0,
        hasDistances: !!results.distances,
        distancesLength: results.distances?.[0]?.length || 0,
        topK,
        minScore
      });

      // Format results
      const candidates = [];
      if (results.ids && results.ids[0]) {
        const sampleDistances = [];
        for (let i = 0; i < results.ids[0].length; i++) {
          const distance = results.distances?.[0]?.[i] ?? null;
          
          // ChromaDB mặc định dùng L2 distance (Euclidean) cho embeddings
          // L2 distance: 0 = identical, càng lớn càng khác nhau (không giới hạn trên)
          // Với normalized embeddings (Sentence-BERT), L2 distance thường trong range 0-2
          // Convert L2 distance to similarity (0-1 scale)
          let similarity;
          if (distance === null || distance === undefined) {
            similarity = 0;
          } else {
            // Normalize L2 distance to similarity
            // Với normalized embeddings, distance thường 0-2
            // Dùng: similarity = 1 - min(distance / maxDistance, 1)
            // Hoặc: similarity = exp(-distance) hoặc 1/(1+distance)
            
            // Thử nhiều cách normalize để tìm cách tốt nhất
            if (distance <= 2) {
              // Có thể là normalized embeddings, dùng linear scaling
              similarity = Math.max(0, 1 - (distance / 2));
            } else {
              // Distance lớn, dùng exponential decay
              similarity = Math.exp(-distance / 2); // Scale down để similarity không quá nhỏ
            }
            
            // Đảm bảo similarity trong range [0, 1]
            similarity = Math.max(0, Math.min(1, similarity));
          }

          // Log sample distances để debug
          if (i < 5) {
            sampleDistances.push({ distance, similarity, candidateId: results.ids[0][i] });
          }

          if (similarity >= minScore) {
            candidates.push({
              candidateId: results.ids[0][i],
              similarity: similarity,
              distance: distance,
              metadata: results.metadatas?.[0]?.[i] || {}
            });
          }
        }
        
        logger.info('📊 Vector search results:', {
          totalResults: results.ids[0].length,
          passedMinScore: candidates.length,
          minScore,
          sampleDistances: sampleDistances.slice(0, 3)
        });
      } else {
        logger.warn('⚠️ ChromaDB query returned no IDs', {
          hasResults: !!results,
          resultsKeys: results ? Object.keys(results) : []
        });
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

      // Query candidates - include all active candidates, not just those with specific availability
      // Also include candidates without availability field set
      const activeCandidates = await CandidateProfile.find({
        $or: [
          { availability: { $in: ['available', 'open_to_opportunities'] } },
          { availability: { $exists: false } },
          { availability: null },
          { status: 'active' }
        ],
        status: { $ne: 'inactive' } // Exclude explicitly inactive
      })
        .select('_id fullName email location availability summary experience skills projects education personalInfo updatedAt userId')
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
   * Ensure candidates are precomputed in ChromaDB
   * Similar to vectorStore.ensurePrecomputed() for jobs
   */
  async ensurePrecomputed() {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          logger.warn('⚠️ Cannot ensure precomputed: ChromaDB not initialized');
          return false;
        }
      }

      // Check if collection has candidates
      try {
        const count = await this.candidateCollection.count();
        if (count > 0) {
          logger.info(`✅ Candidates already indexed (${count} candidates)`);
          return true;
        }
      } catch (error) {
        // Collection might not exist or be empty, continue to sync
        logger.debug('Collection count check failed, will sync candidates:', error.message);
      }

      // Sync all candidates
      logger.info('🔄 Candidates not precomputed, starting sync...');
      const result = await this.syncAllCandidates();
      
      if (result.indexed > 0) {
        logger.info(`✅ Precomputed ${result.indexed} candidates successfully`);
        return true;
      } else {
        logger.warn('⚠️ No candidates were indexed during precompute');
        return false;
      }
    } catch (error) {
      logger.error('❌ Failed to ensure precomputed candidates:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Build text representation of candidate for embedding
   */
  _buildCandidateText(candidate) {
    // Candidate object structure (no cv sub-document)
    const stringifySkills = (skills) => {
      if (!skills) return '';
      // Handle CandidateProfile skills structure: { technical: [], soft: [], languages: [] }
      if (typeof skills === 'object' && !Array.isArray(skills)) {
        const allSkills = [
          ...(skills.technical || []),
          ...(skills.soft || []),
          ...(skills.languages || [])
        ];
        return allSkills.map((s) => (typeof s === 'string' ? s : s?.name || s?.title || s || '')).filter(Boolean).join(' ');
      }
      if (Array.isArray(skills)) {
        return skills.map((s) => (typeof s === 'string' ? s : s?.name || s?.title || s || '')).filter(Boolean).join(' ');
      }
      return '';
    };

    const stringifyExperience = (exp) => {
      if (!exp) return '';
      // Handle both direct array and nested structure
      if (Array.isArray(exp)) {
        return exp.map((e) => `${e.position || e.title || ''} ${e.description || e.responsibilities || ''} ${e.company || ''}`).filter(Boolean).join(' ');
      }
      // Handle nested structure: { internships: [], fullTime: [] }
      if (exp.internships || exp.fullTime) {
        const internships = exp.internships || [];
        const fullTime = exp.fullTime || [];
        const allExp = [...internships, ...fullTime];
        return allExp.map((e) => `${e.position || e.title || ''} ${e.description || e.responsibilities || ''} ${e.company || ''}`).filter(Boolean).join(' ');
      }
      return '';
    };

    const stringifyEducation = (edu) => {
      if (!edu) return '';
      if (Array.isArray(edu)) {
        return edu.map((e) => `${e.degree || ''} ${e.major || e.field || ''} ${e.school || e.institution || ''}`).filter(Boolean).join(' ');
      }
      return '';
    };

    const parts = [
      candidate.fullName || candidate.personalInfo?.fullName || '',
      candidate.summary || candidate.personalInfo?.summary || '',
      stringifyExperience(candidate.experience),
      stringifySkills(candidate.skills),
      stringifyEducation(candidate.education),
      candidate.projects?.map((p) => `${p.title || p.name || ''} ${p.description || ''}`).filter(Boolean).join(' ') || '',
    ].filter((p) => p && p.length > 0);

    const text = parts.join(' ').substring(0, 2000);
    
    // Ensure we always return a non-empty string
    if (!text || text.trim().length === 0) {
      // Fallback: use at least the candidate name or ID
      return candidate.fullName || candidate.email || candidate._id?.toString() || 'candidate';
    }
    
    return text;
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

