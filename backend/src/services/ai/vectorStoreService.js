/**
 * Vector Store Service
 * Manages ChromaDB for storing and searching learning resources
 * 
 * ChromaDB is a lightweight, open-source vector database
 * Perfect for MVP and can scale to production
 */

const { ChromaClient } = require('chromadb');
const { logger } = require('../../utils/logger');
require('dotenv').config();

// Lazy load embeddingService to avoid initialization errors
let embeddingService = null;
function getEmbeddingService() {
  if (!embeddingService) {
    try {
      embeddingService = require('./embeddingService');
    } catch (error) {
      logger.warn('Embedding service not available', { error: error.message });
      return null;
    }
  }
  return embeddingService;
}

class VectorStoreService {
  constructor() {
    try {
      // Initialize ChromaDB client
      // If CHROMA_URL is set, connect to remote instance
      // Otherwise, use local instance (default)
      const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
      
      this.client = new ChromaClient({
        path: chromaUrl,
      });

      this.collectionName = process.env.CHROMA_COLLECTION_NAME || 'learning-resources';
      this.collection = null;
      
      logger.info('ChromaDB client initialized', { chromaUrl, collectionName: this.collectionName });
    } catch (error) {
      logger.error('Failed to initialize ChromaDB client:', error);
      this.client = null;
    }
  }

  /**
   * Initialize or get collection
   * Creates collection if it doesn't exist
   * Returns null if ChromaDB is not available (graceful fallback)
   */
  async initializeCollection() {
    try {
      if (!this.client) {
        return null; // Graceful fallback
      }

      // Check if collection exists
      const collections = await this.client.listCollections();
      let existingCollection = collections.find(
        (col) => col.name === this.collectionName
      );

      if (existingCollection) {
        // Try to get existing collection
        // Note: May have warning about DefaultEmbeddingFunction if collection was created with it
        // This is OK - we provide embeddings directly, so we don't need the default function
        try {
          this.collection = await this.client.getCollection({
            name: this.collectionName,
          });
          logger.info('Using existing ChromaDB collection', { collectionName: this.collectionName });
        } catch (error) {
          // If collection has embedding function issue, delete and recreate
          logger.warn('Existing collection has embedding function issue, recreating...', {
            collectionName: this.collectionName,
            error: error.message
          });
          try {
            await this.client.deleteCollection({ name: this.collectionName });
            logger.info('Deleted old collection', { collectionName: this.collectionName });
          } catch (deleteError) {
            // Ignore delete errors
          }
          // Will create new collection below
          existingCollection = null;
        }
      }
      
      if (!existingCollection) {
        // Create new collection without embedding function
        // We provide embeddings directly, so no need for default embedding function
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Learning resources for personalized roadmaps',
            createdAt: new Date().toISOString(),
          },
          // Don't specify embedding function - we provide embeddings directly
        });
        logger.info('Created new ChromaDB collection', { collectionName: this.collectionName });
      }

      return this.collection;
    } catch (error) {
      // ChromaDB not available - this is expected if not running
      // Don't log as error, just return null for graceful fallback
      logger.debug('ChromaDB not available, using fallback', { 
        error: error.message,
        note: 'This is expected if ChromaDB is not running. System will use API-based recommendations.'
      });
      this.client = null; // Mark as unavailable
      return null;
    }
  }

  /**
   * Add a resource to the vector database
   * 
   * @param {Object} resource - Resource object
   * @param {string} resource.id - Unique resource ID
   * @param {string} resource.title - Resource title
   * @param {string} resource.description - Resource description
   * @param {string[]} resource.skills - Skills covered
   * @param {string} resource.level - Difficulty level
   * @param {string} resource.provider - Provider name
   * @param {string} resource.type - Resource type
   * @param {string} resource.url - Resource URL
   * @param {number} resource.rating - Rating (0-5)
   * @param {boolean} resource.isFree - Is free resource
   * @param {number} resource.estimatedCost - Estimated cost
   * @returns {Promise<void>}
   */
  async addResource(resource) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }

      const {
        id,
        title,
        description,
        skills = [],
        level,
        provider,
        type,
        url,
        rating,
        isFree,
        estimatedCost,
        duration,
        certificateOffered,
      } = resource;

      if (!id || !title) {
        throw new Error('Resource must have id and title');
      }

      // Generate embedding
      const embeddingServiceInstance = getEmbeddingService();
      if (!embeddingServiceInstance || !embeddingServiceInstance.isAvailable()) {
        throw new Error('Embedding service not available.');
      }

      const embedding = await embeddingServiceInstance.embedResource(resource);

      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Failed to generate embedding for resource');
      }

      // Prepare metadata (ChromaDB stores metadata as strings/numbers)
      const metadata = {
        title: String(title),
        description: String(description || ''),
        skills: Array.isArray(skills) ? skills.join(',') : String(skills),
        level: String(level || ''),
        provider: String(provider || ''),
        type: String(type || ''),
        url: String(url || ''),
        rating: rating ? Number(rating) : 0,
        isFree: isFree ? 'true' : 'false',
        estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
        duration: String(duration || ''),
        certificateOffered: certificateOffered ? 'true' : 'false',
        indexedAt: new Date().toISOString(),
      };

      // Add to collection
      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [
          `${title} ${description} Skills: ${Array.isArray(skills) ? skills.join(', ') : skills} Level: ${level} Provider: ${provider}`,
        ],
      });

      logger.info('Resource added to vector database', { resourceId: id, title });
    } catch (error) {
      logger.error('Error adding resource to vector database:', {
        error: error.message,
        resourceId: resource.id,
      });
      throw error;
    }
  }

  /**
   * Add multiple resources in batch
   * 
   * @param {Object[]} resources - Array of resource objects
   * @returns {Promise<void>}
   */
  async addResources(resources) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }

      if (!Array.isArray(resources) || resources.length === 0) {
        return;
      }

      // Generate embeddings for all resources
      const embeddingServiceInstance = getEmbeddingService();
      if (!embeddingServiceInstance || !embeddingServiceInstance.isAvailable()) {
        throw new Error('Embedding service not available.');
      }

      const embeddings = await embeddingServiceInstance.generateEmbeddings(
        resources.map((r) =>
          `${r.title} ${r.description || ''} Skills: ${Array.isArray(r.skills) ? r.skills.join(', ') : r.skills || ''} Level: ${r.level || ''} Provider: ${r.provider || ''}`
        )
      );

      if (embeddings.length !== resources.length) {
        throw new Error('Embedding count mismatch');
      }

      // Prepare data for batch insert
      const ids = resources.map((r) => r.id);
      const metadatas = resources.map((r) => ({
        title: String(r.title),
        description: String(r.description || ''),
        skills: Array.isArray(r.skills) ? r.skills.join(',') : String(r.skills || ''),
        level: String(r.level || ''),
        provider: String(r.provider || ''),
        type: String(r.type || ''),
        url: String(r.url || ''),
        rating: r.rating ? Number(r.rating) : 0,
        isFree: r.isFree ? 'true' : 'false',
        estimatedCost: r.estimatedCost ? Number(r.estimatedCost) : 0,
        duration: String(r.duration || ''),
        certificateOffered: r.certificateOffered ? 'true' : 'false',
        indexedAt: new Date().toISOString(),
      }));
      const documents = resources.map(
        (r) =>
          `${r.title} ${r.description || ''} Skills: ${Array.isArray(r.skills) ? r.skills.join(', ') : r.skills || ''} Level: ${r.level || ''} Provider: ${r.provider || ''}`
      );

      // Batch insert
      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents,
      });

      logger.info('Batch resources added to vector database', { count: resources.length });
    } catch (error) {
      logger.error('Error adding batch resources to vector database:', {
        error: error.message,
        count: resources.length,
      });
      throw error;
    }
  }

  /**
   * Search for resources using semantic similarity
   * 
   * @param {Object} queryParams - Search parameters
   * @param {string} queryParams.skill - Skill to learn
   * @param {string} queryParams.difficulty - Difficulty level
   * @param {string} queryParams.learningStage - Learning stage
   * @param {string[]} queryParams.objectives - Learning objectives
   * @param {Object} filters - Metadata filters
   * @param {number} limit - Number of results to return
   * @returns {Promise<Object[]>} Array of matching resources (empty if ChromaDB not available)
   */
  async searchResources(queryParams, filters = {}, limit = 10) {
    try {
      if (!this.collection) {
        const collection = await this.initializeCollection();
        if (!collection) {
          // ChromaDB not available - return empty array for graceful fallback
          return [];
        }
      }

      // Generate query embedding
      const embeddingServiceInstance = getEmbeddingService();
      if (!embeddingServiceInstance || !embeddingServiceInstance.isAvailable()) {
        return []; // Graceful fallback
      }

      const queryEmbedding = await embeddingServiceInstance.embedSearchQuery(queryParams);

      if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        return []; // Graceful fallback
      }

      // Build where clause for metadata filtering
      const where = {};
      
      if (filters.level) {
        where.level = filters.level;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.provider) {
        where.provider = filters.provider;
      }
      
      if (filters.isFree !== undefined) {
        where.isFree = filters.isFree ? 'true' : 'false';
      }
      
      if (filters.minRating) {
        where.rating = { $gte: filters.minRating };
      }

      // Search
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: Object.keys(where).length > 0 ? where : undefined,
      });

      // Transform results to resource format
      const resources = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const metadata = results.metadatas[0][i];
          const distance = results.distances[0][i];
          
          // Convert distance to similarity score (1 - distance)
          const similarity = 1 - distance;

          // Normalize URL trước khi trả về
          const resourceHealthCheckService = require('./resourceHealthCheckService');
          const normalizedUrl = resourceHealthCheckService.normalizeUrl(metadata.url) || metadata.url;
          
          resources.push({
            id: results.ids[0][i],
            title: metadata.title,
            description: metadata.description,
            skills: metadata.skills ? metadata.skills.split(',') : [],
            level: metadata.level,
            provider: metadata.provider,
            type: metadata.type,
            url: normalizedUrl, // ✅ Normalized URL
            rating: metadata.rating ? Number(metadata.rating) : 0,
            isFree: metadata.isFree === 'true',
            estimatedCost: metadata.estimatedCost ? Number(metadata.estimatedCost) : 0,
            duration: metadata.duration,
            certificateOffered: metadata.certificateOffered === 'true',
            similarity, // Semantic similarity score (0-1)
            indexedAt: metadata.indexedAt, // For freshness validation
          });
        }
      }

      logger.info('Vector search completed', {
        query: queryParams.skill,
        resultsCount: resources.length,
      });

      return resources;
    } catch (error) {
      // ChromaDB not available - this is expected if not running
      // Don't log as error, just return empty for graceful fallback
      logger.debug('Vector search unavailable, using fallback', {
        error: error.message,
        queryParams: queryParams.skill,
        note: 'ChromaDB not running. System will use API-based recommendations.'
      });
      this.client = null; // Mark as unavailable
      return []; // Return empty array for graceful fallback
    }
  }

  /**
   * Delete a resource from vector database
   * 
   * @param {string} resourceId - Resource ID to delete
   * @returns {Promise<void>}
   */
  async deleteResource(resourceId) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }

      await this.collection.delete({
        ids: [resourceId],
      });

      logger.info('Resource deleted from vector database', { resourceId });
    } catch (error) {
      logger.error('Error deleting resource from vector database:', {
        error: error.message,
        resourceId,
      });
      throw error;
    }
  }

  /**
   * Get collection stats
   * 
   * @returns {Promise<Object>} Collection statistics
   */
  async getCollectionStats() {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }

      const count = await this.collection.count();
      
      return {
        collectionName: this.collectionName,
        resourceCount: count,
        status: 'active',
      };
    } catch (error) {
      logger.error('Error getting collection stats:', error);
      return {
        collectionName: this.collectionName,
        resourceCount: 0,
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Check if vector store is available
   * Note: This only checks if client is initialized, not if ChromaDB is actually running
   * The actual connection will be tested when searchResources() is called
   * 
   * @returns {boolean}
   */
  isAvailable() {
    // Check both ChromaDB client and embedding service
    const embeddingServiceInstance = getEmbeddingService();
    return this.client !== null && 
           embeddingServiceInstance !== null && 
           embeddingServiceInstance.isAvailable();
  }

  /**
   * Check if ChromaDB is actually running and accessible
   * This performs a lightweight connection test
   * 
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    try {
      if (!this.client) {
        return false;
      }
      // Try to list collections (lightweight operation)
      await this.client.listCollections();
      return true;
    } catch (error) {
      this.client = null; // Mark as unavailable
      return false;
    }
  }
}

module.exports = new VectorStoreService();

