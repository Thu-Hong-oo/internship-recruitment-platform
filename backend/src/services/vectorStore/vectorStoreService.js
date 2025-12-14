const { ChromaClient } = require('chromadb');
const { HuggingFaceInferenceEmbeddings } = require('@langchain/community/embeddings/hf');
const { logger } = require('../../utils/logger');

/**
 * Vector Store Service using ChromaDB
 * Manages embeddings and semantic search for curated learning resources
 *
 * Improvements (2025-12-14):
 * - Retry + backoff for HF embeddings
 * - Early credibility filtering in Chroma query
 * - Better popularity normalization
 * - Code refactoring & warmup support
 * - Improved scoring weights
 *
 * @author Thu-Hong-oo (updated by Grok assistance)
 */
class VectorStoreService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = 'learning_resources';
    
    this.embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGING_FACE_API_KEY || 'hf_default',
      model: 'sentence-transformers/all-mpnet-base-v2',
    });

    this.initialized = false;
  }

  /**
   * Build text used for embedding from resource fields
   */
  _buildEmbeddingText(resource) {
    return `${resource.title || ''} ${resource.description || ''} ${resource.skill || ''} ${resource.type || ''}`.trim();
  }

  /**
   * Initialize ChromaDB client and collection
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      // Determine ChromaDB URL based on environment
      let chromaUrl;
      if (process.env.CHROMADB_URL || process.env.CHROMA_URL) {
        chromaUrl = process.env.CHROMADB_URL || process.env.CHROMA_URL;
        logger.info(`Using external ChromaDB: ${chromaUrl}`);
      } else if (
        process.env.NODE_ENV === 'production' ||
        process.env.AWS_EXECUTION_ENV ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env._?.includes('apprunner')
      ) {
        chromaUrl = 'http://localhost:8001';
        logger.info('Using embedded ChromaDB on port 8001 (production)');
      } else {
        chromaUrl = 'http://localhost:8000';
        logger.info('Using local ChromaDB on port 8000 (development)');
      }

      this.client = new ChromaClient({ path: chromaUrl });
      logger.info('🔗 Connecting to ChromaDB...');

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({ name: this.collectionName });
        logger.info(`✅ Loaded existing collection: ${this.collectionName}`);
      } catch {
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Curated learning resources from YouTube, GitHub, Roadmap.sh',
            createdAt: new Date().toISOString(),
            version: '2.0',
          },
        });
        logger.info(`✅ Created new collection: ${this.collectionName}`);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('❌ ChromaDB initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Generate embedding with retry and exponential backoff
   */
  async generateEmbedding(text, maxRetries = 4) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.embeddings.embedQuery(text);
      } catch (error) {
        const isRateLimit = error.message?.includes('429') || error.status === 429;
        if (attempt === maxRetries - 1 || !isRateLimit) {
          logger.error('❌ Embedding generation failed permanently:', error.message);
          throw error;
        }
        const delay = 1000 * 2 ** attempt; // 1s, 2s, 4s, 8s
        logger.warn(`⚠️ Rate limited, retrying in ${delay / 1000}s... (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Warm up embedding model (call on app startup to reduce cold start latency)
   */
  async warmup() {
    try {
      await this.generateEmbedding('warmup query for learning resources');
      logger.info('✅ Embedding model warmed up');
    } catch (error) {
      logger.warn('⚠️ Warmup failed (non-critical):', error.message);
    }
  }

  /**
   * Add single resource
   */
  async addResource(resource) {
    try {
      if (!this.initialized) await this.initialize();

      const embeddingText = this._buildEmbeddingText(resource);
      const embedding = await this.generateEmbedding(embeddingText);

      await this.collection.add({
        ids: [resource.id],
        embeddings: [embedding],
        metadatas: [{
          title: resource.title,
          description: resource.description,
          url: resource.url,
          type: resource.type,
          skill: resource.skill,
          difficulty: resource.difficulty,
          duration: resource.duration,
          source: resource.source,
          credibility: resource.credibility,
          rating: resource.rating || 0,
          popularity: resource.popularity || 0,
          lastVerified: new Date().toISOString(),
        }],
        documents: [embeddingText],
      });

      logger.info(`✅ Added resource: ${resource.title}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to add resource "${resource.title}":`, error.message);
      return false;
    }
  }

  /**
   * Batch add resources
   */
  async addResourcesBatch(resources) {
    if (resources.length === 0) return true;

    try {
      if (!this.initialized) await this.initialize();

      const ids = [];
      const embeddings = [];
      const metadatas = [];
      const documents = [];

      for (const resource of resources) {
        const embeddingText = this._buildEmbeddingText(resource);
        const embedding = await this.generateEmbedding(embeddingText);

        ids.push(resource.id);
        embeddings.push(embedding);
        metadatas.push({
          title: resource.title,
          description: resource.description,
          url: resource.url,
          type: resource.type,
          skill: resource.skill,
          difficulty: resource.difficulty,
          duration: resource.duration,
          source: resource.source,
          credibility: resource.credibility,
          rating: resource.rating || 0,
          popularity: resource.popularity || 0,
          lastVerified: new Date().toISOString(),
        });
        documents.push(embeddingText);
      }

      await this.collection.add({ ids, embeddings, metadatas, documents });
      logger.info(`✅ Batch added ${resources.length} resources`);
      return true;
    } catch (error) {
      logger.error('❌ Batch add failed:', error.message);
      return false;
    }
  }

  /**
   * Semantic search with filters and improved scoring
   * Supports multiple call signatures for backward compatibility:
   * 1. searchResources(queryString, options) - query is string
   * 2. searchResources(queryParams, filters, limit) - queryParams is object (legacy)
   */
  async searchResources(queryOrParams, optionsOrFilters = {}, limit = null) {
    try {
      if (!this.initialized) await this.initialize();

      // Handle legacy signature: searchResources(queryParams, filters, limit)
      let query, options;
      if (typeof queryOrParams === 'object' && queryOrParams !== null && !Array.isArray(queryOrParams)) {
        // Legacy signature: queryParams is object
        const queryParams = queryOrParams;
        const filters = optionsOrFilters;
        const queryLimit = limit || 10;
        
        // Build query string from queryParams
        const parts = [];
        if (queryParams.skill) parts.push(queryParams.skill);
        if (queryParams.difficulty) parts.push(`${queryParams.difficulty} level`);
        if (queryParams.learningStage) parts.push(queryParams.learningStage);
        if (queryParams.objectives && Array.isArray(queryParams.objectives)) {
          parts.push(...queryParams.objectives);
        }
        query = parts.join(' ') || 'learning resources';
        
        // Convert filters to options format
        options = {
          topK: queryLimit,
          skill: queryParams.skill || filters.skill || null,
          difficulty: queryParams.difficulty || filters.level || null,
          type: filters.type || null,
          minCredibility: filters.minRating ? filters.minRating / 5.0 : 0.6,
        };
      } else {
        // New signature: query is string
        query = typeof queryOrParams === 'string' ? queryOrParams : String(queryOrParams);
        options = optionsOrFilters || {};
        if (limit) {
          options.topK = limit;
        }
      }

      const {
        topK = 5,
        skill = null,
        difficulty = null,
        type = null,
        minCredibility = 0.6,
      } = options;

      const queryEmbedding = await this.generateEmbedding(query);

      // Build where filter including credibility early
      const whereConditions = [{ credibility: { $gte: minCredibility } }];
      if (skill) whereConditions.push({ skill: { $eq: skill } });
      if (difficulty) whereConditions.push({ difficulty: { $eq: difficulty } });
      if (type) whereConditions.push({ type: { $eq: type } });

      const where = whereConditions.length === 1
        ? whereConditions[0]
        : { $and: whereConditions };

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK * 3, // Extra buffer in case of scoring
        where,
      });

      const resources = [];
      if (results.ids?.[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const metadata = results.metadatas[0][i];
          const distance = results.distances[0][i];
          const similarity = 1 / (1 + distance);

          // Normalize popularity (log scale, cap at reasonable max)
          const normalizedPopularity = metadata.popularity
            ? Math.min(1, Math.log10(Math.max(metadata.popularity, 1000)) / 6)
            : 0;

          const score = 
            similarity * 0.6 + 
            metadata.credibility * 0.3 + 
            normalizedPopularity * 0.1;

          resources.push({
            id: results.ids[0][i],
            title: metadata.title,
            description: metadata.description,
            url: metadata.url,
            type: metadata.type,
            skill: metadata.skill,
            difficulty: metadata.difficulty,
            duration: metadata.duration,
            source: metadata.source,
            credibility: metadata.credibility,
            rating: metadata.rating,
            popularity: metadata.popularity,
            similarity: parseFloat(similarity.toFixed(4)),
            score: parseFloat(score.toFixed(4)),
            lastVerified: metadata.lastVerified,
          });
        }
      }

      // Sort by final score and limit
      resources.sort((a, b) => b.score - a.score);
      logger.info(`✅ Found ${resources.length} resources → returning top ${topK} for query: "${query}"`);

      return resources.slice(0, topK);
    } catch (error) {
      logger.error('❌ Vector search failed:', error.message);
      return [];
    }
  }

  /**
   * Update resource metadata
   */
  async updateResource(resourceId, updates) {
    try {
      if (!this.initialized) await this.initialize();

      await this.collection.update({
        ids: [resourceId],
        metadatas: [{ ...updates, lastVerified: new Date().toISOString() }],
      });

      logger.info(`✅ Updated resource: ${resourceId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Update failed for ${resourceId}:`, error.message);
      return false;
    }
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId) {
    try {
      if (!this.initialized) await this.initialize();
      await this.collection.delete({ ids: [resourceId] });
      logger.info(`✅ Deleted resource: ${resourceId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Delete failed for ${resourceId}:`, error.message);
      return false;
    }
  }

  /**
   * Get collection stats
   */
  async getStats() {
    try {
      if (!this.initialized) await this.initialize();
      const count = await this.collection.count();
      return {
        totalResources: count,
        collectionName: this.collectionName,
        initialized: this.initialized,
      };
    } catch (error) {
      logger.error('❌ Failed to get stats:', error.message);
      return null;
    }
  }

  /**
   * Clear entire collection (dangerous - use carefully)
   */
  async clearCollection() {
    try {
      if (!this.initialized) await this.initialize();
      await this.client.deleteCollection({ name: this.collectionName });
      logger.warn(`⚠️ Collection ${this.collectionName} cleared`);
      this.initialized = false;
      await this.initialize(); // Recreate
      return true;
    } catch (error) {
      logger.error('❌ Clear collection failed:', error.message);
      return false;
    }
  }

  /**
   * Check if service is available
   * @returns {boolean} True if service is initialized and ready
   */
  isAvailable() {
    return this.initialized && this.client !== null && this.collection !== null;
  }

  /**
   * Alias for addResourcesBatch for compatibility
   * @param {Array<Object>} resources - Array of learning resources
   * @returns {Promise<boolean>} Success status
   */
  async addResources(resources) {
    return this.addResourcesBatch(resources);
  }
}

// Export singleton instance
const vectorStoreService = new VectorStoreService();

module.exports = vectorStoreService;