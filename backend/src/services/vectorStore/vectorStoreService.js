const { ChromaClient } = require('chromadb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../../utils/logger');

/**
 * Vector Store Service using ChromaDB
 * Manages embeddings and semantic search for learning resources
 * 
 * @description Provides credible, verifiable learning resources for thesis
 * @author Thu-Hong-oo
 * @date 2025-12-01
 */
class VectorStoreService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = 'learning_resources';
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: process.env.CHROMADB_URL || 'http://localhost:8000',
      });

      logger.info('🔗 Connecting to ChromaDB...');

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
        });
        logger.info(`✅ Connected to existing collection: ${this.collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Curated learning resources from YouTube, GitHub, Roadmap.sh',
            createdAt: new Date().toISOString(),
            version: '1.0',
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
   * Generate embedding vector using Gemini
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      logger.error('❌ Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Add a learning resource to vector database
   * @param {Object} resource - Learning resource with metadata
   */
  async addResource(resource) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Generate embedding for resource description
      const embeddingText = `${resource.title} ${resource.description} ${resource.skill} ${resource.type}`;
      const embedding = await this.generateEmbedding(embeddingText);

      // Add to collection
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

      logger.info(`✅ Added resource to vector DB: ${resource.title}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to add resource: ${resource.title}`, error);
      return false;
    }
  }

  /**
   * Batch add multiple resources
   * @param {Array<Object>} resources - Array of learning resources
   */
  async addResourcesBatch(resources) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const ids = [];
      const embeddings = [];
      const metadatas = [];
      const documents = [];

      // Process all resources
      for (const resource of resources) {
        const embeddingText = `${resource.title} ${resource.description} ${resource.skill} ${resource.type}`;
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

      // Batch insert
      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents,
      });

      logger.info(`✅ Batch added ${resources.length} resources to vector DB`);
      return true;
    } catch (error) {
      logger.error('❌ Batch add failed:', error);
      return false;
    }
  }

  /**
   * Search for relevant learning resources using semantic search
   * @param {string} query - Search query (e.g., "Learn React for frontend development")
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Relevant resources with similarity scores
   */
  async searchResources(query, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        topK = 5,
        skill = null,
        difficulty = null,
        type = null,
        minCredibility = 0.6,
      } = options;

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Build where filter
      const whereFilter = {};
      if (skill) whereFilter.skill = skill;
      if (difficulty) whereFilter.difficulty = difficulty;
      if (type) whereFilter.type = type;

      // Query collection
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK * 2, // Get more results for filtering
        where: Object.keys(whereFilter).length > 0 ? whereFilter : undefined,
      });

      // Format and filter results
      const resources = [];
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const metadata = results.metadatas[0][i];
          const distance = results.distances[0][i];
          
          // Convert distance to similarity score (closer to 1 is better)
          const similarity = 1 / (1 + distance);
          
          // Filter by credibility
          if (metadata.credibility >= minCredibility) {
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
              similarity: similarity,
              lastVerified: metadata.lastVerified,
            });
          }
        }
      }

      // Sort by combined score (similarity + credibility + popularity)
      resources.sort((a, b) => {
        const scoreA = a.similarity * 0.5 + a.credibility * 0.3 + (a.popularity / 100000) * 0.2;
        const scoreB = b.similarity * 0.5 + b.credibility * 0.3 + (b.popularity / 100000) * 0.2;
        return scoreB - scoreA;
      });

      logger.info(`✅ Found ${resources.length} relevant resources for: "${query}"`);
      return resources.slice(0, topK);
    } catch (error) {
      logger.error('❌ Vector search failed:', error);
      return [];
    }
  }

  /**
   * Update resource metadata (e.g., refresh credibility scores)
   * @param {string} resourceId - Resource ID
   * @param {Object} updates - Fields to update
   */
  async updateResource(resourceId, updates) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.collection.update({
        ids: [resourceId],
        metadatas: [{
          ...updates,
          lastVerified: new Date().toISOString(),
        }],
      });

      logger.info(`✅ Updated resource: ${resourceId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to update resource: ${resourceId}`, error);
      return false;
    }
  }

  /**
   * Delete resource from vector database
   * @param {string} resourceId - Resource ID
   */
  async deleteResource(resourceId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.collection.delete({
        ids: [resourceId],
      });

      logger.info(`✅ Deleted resource: ${resourceId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to delete resource: ${resourceId}`, error);
      return false;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const count = await this.collection.count();

      return {
        totalResources: count,
        collectionName: this.collectionName,
        initialized: this.initialized,
      };
    } catch (error) {
      logger.error('❌ Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Clear all resources (use with caution!)
   */
  async clearCollection() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.client.deleteCollection({ name: this.collectionName });
      logger.warn(`⚠️ Cleared collection: ${this.collectionName}`);

      // Recreate collection
      await this.initialize();
      return true;
    } catch (error) {
      logger.error('❌ Failed to clear collection:', error);
      return false;
    }
  }
}

// Export singleton instance
const vectorStoreService = new VectorStoreService();

module.exports = vectorStoreService;
