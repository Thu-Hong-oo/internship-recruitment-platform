/**
 * Resource Indexing Service
 * Indexes learning resources into ChromaDB vector database
 * 
 * This service handles:
 * - Collecting resources from various sources
 * - Generating embeddings
 * - Storing in vector database
 * - Updating existing resources
 */

const vectorStoreService = require('../vectorStore/vectorStoreService');
const { logger } = require('../../utils/logger');

class ResourceIndexingService {
  constructor() {
    this.indexedCount = 0;
    this.failedCount = 0;
  }

  /**
   * Index a single resource
   * 
   * @param {Object} resource - Resource object
   * @returns {Promise<boolean>} Success status
   */
  async indexResource(resource) {
    try {
      if (!vectorStoreService.isAvailable()) {
        logger.warn('Vector store not available, skipping indexing');
        return false;
      }

      // Ensure resource has required fields
      if (!resource.id) {
        resource.id = this._generateResourceId(resource);
      }

      if (!resource.title) {
        throw new Error('Resource must have a title');
      }

      await vectorStoreService.addResource(resource);
      this.indexedCount++;
      
      logger.info('Resource indexed successfully', {
        resourceId: resource.id,
        title: resource.title,
      });

      return true;
    } catch (error) {
      this.failedCount++;
      logger.error('Error indexing resource:', {
        error: error.message,
        resourceId: resource.id,
        title: resource.title,
      });
      return false;
    }
  }

  /**
   * Index multiple resources in batch
   * 
   * @param {Object[]} resources - Array of resource objects
   * @returns {Promise<Object>} Indexing results
   */
  async indexResources(resources) {
    try {
      if (!vectorStoreService.isAvailable()) {
        logger.warn('Vector store not available, skipping batch indexing');
        return {
          success: false,
          indexed: 0,
          failed: resources.length,
          message: 'Vector store not available',
        };
      }

      if (!Array.isArray(resources) || resources.length === 0) {
        return {
          success: true,
          indexed: 0,
          failed: 0,
          message: 'No resources to index',
        };
      }

      // Ensure all resources have IDs
      const resourcesWithIds = resources.map((resource) => ({
        ...resource,
        id: resource.id || this._generateResourceId(resource),
      }));

      // Validate resources
      const validResources = resourcesWithIds.filter((resource) => {
        if (!resource.title) {
          logger.warn('Skipping resource without title', { resourceId: resource.id });
          return false;
        }
        return true;
      });

      if (validResources.length === 0) {
        return {
          success: false,
          indexed: 0,
          failed: resources.length,
          message: 'No valid resources to index',
        };
      }

      // Batch index
      await vectorStoreService.addResources(validResources);
      
      this.indexedCount += validResources.length;
      this.failedCount += resources.length - validResources.length;

      logger.info('Batch indexing completed', {
        total: resources.length,
        indexed: validResources.length,
        failed: resources.length - validResources.length,
      });

      return {
        success: true,
        indexed: validResources.length,
        failed: resources.length - validResources.length,
        message: 'Batch indexing completed',
      };
    } catch (error) {
      logger.error('Error in batch indexing:', {
        error: error.message,
        count: resources.length,
      });
      
      return {
        success: false,
        indexed: 0,
        failed: resources.length,
        message: error.message,
      };
    }
  }

  /**
   * Index sample resources for testing
   * 
   * @returns {Promise<Object>} Indexing results
   */
  async indexSampleResources() {
    const sampleResources = [
      {
        id: 'react-fundamentals-udemy',
        title: 'React - The Complete Guide (incl Hooks, React Router, Redux)',
        description: 'Dive in and learn React.js from scratch! Learn React, Hooks, Redux, React Router, and more.',
        skills: ['React', 'JavaScript', 'Redux', 'React Router'],
        level: 'beginner',
        provider: 'Udemy',
        type: 'course',
        url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
        rating: 4.7,
        isFree: false,
        estimatedCost: 19.99,
        duration: '48 hours',
        certificateOffered: true,
      },
      {
        id: 'react-official-docs',
        title: 'React Official Documentation',
        description: 'The official React documentation with guides, API reference, and tutorials.',
        skills: ['React', 'JavaScript', 'JSX'],
        level: 'intermediate',
        provider: 'Official Docs',
        type: 'documentation',
        url: 'https://react.dev',
        rating: 5.0,
        isFree: true,
        estimatedCost: 0,
        duration: 'Reference',
        certificateOffered: false,
      },
      {
        id: 'nodejs-complete-course',
        title: 'Node.js - The Complete Guide (MVC, REST APIs, GraphQL, Deno)',
        description: 'Master Node.js and build RESTful APIs, GraphQL APIs, add Authentication, use MongoDB, SQL and much more!',
        skills: ['Node.js', 'Express', 'MongoDB', 'REST API'],
        level: 'intermediate',
        provider: 'Udemy',
        type: 'course',
        url: 'https://www.udemy.com/course/nodejs-the-complete-guide/',
        rating: 4.6,
        isFree: false,
        estimatedCost: 24.99,
        duration: '40 hours',
        certificateOffered: true,
      },
      {
        id: 'javascript-basics-youtube',
        title: 'JavaScript Crash Course For Beginners',
        description: 'A comprehensive JavaScript course for beginners covering all the fundamentals.',
        skills: ['JavaScript', 'ES6', 'DOM'],
        level: 'beginner',
        provider: 'YouTube - Traversy Media',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
        rating: 4.8,
        isFree: true,
        estimatedCost: 0,
        duration: '2 hours',
        certificateOffered: false,
      },
      {
        id: 'mongodb-university',
        title: 'MongoDB University - M001: MongoDB Basics',
        description: 'Learn the fundamentals of MongoDB including CRUD operations, data modeling, and indexing.',
        skills: ['MongoDB', 'Database', 'NoSQL'],
        level: 'beginner',
        provider: 'MongoDB University',
        type: 'course',
        url: 'https://university.mongodb.com/courses/M001/about',
        rating: 4.9,
        isFree: true,
        estimatedCost: 0,
        duration: '5 weeks',
        certificateOffered: true,
      },
    ];

    return this.indexResources(sampleResources);
  }

  /**
   * Generate a unique resource ID
   * 
   * @param {Object} resource - Resource object
   * @returns {string} Generated ID
   */
  _generateResourceId(resource) {
    // Use URL if available, otherwise use title + provider
    if (resource.url) {
      // Extract ID from URL or use URL hash
      const urlHash = require('crypto')
        .createHash('md5')
        .update(resource.url)
        .digest('hex')
        .substring(0, 12);
      return `${resource.type || 'resource'}-${urlHash}`;
    }

    // Fallback: use title + provider
    const titleSlug = (resource.title || 'resource')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50);
    const providerSlug = (resource.provider || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    
    return `${providerSlug}-${titleSlug}`;
  }

  /**
   * Get indexing statistics
   * 
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const stats = await vectorStoreService.getCollectionStats();
    
    return {
      ...stats,
      indexedCount: this.indexedCount,
      failedCount: this.failedCount,
    };
  }

  /**
   * Delete a resource from index
   * 
   * @param {string} resourceId - Resource ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteResource(resourceId) {
    try {
      await vectorStoreService.deleteResource(resourceId);
      logger.info('Resource deleted from index', { resourceId });
      return true;
    } catch (error) {
      logger.error('Error deleting resource from index:', {
        error: error.message,
        resourceId,
      });
      return false;
    }
  }
}

module.exports = new ResourceIndexingService();

