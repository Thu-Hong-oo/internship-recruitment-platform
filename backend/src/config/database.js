const mongoose = require('mongoose');
const { createClient } = require('redis');
const config = require('../config');

/**
 * Database Configuration Module
 * Handles MongoDB and Redis connections
 */
class DatabaseConfig {
  constructor() {
    this.mongoClient = null;
    this.redisClient = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connectMongoDB() {
    try {
      if (this.mongoClient) {
        return this.mongoClient;
      }

      console.log('🔄 Connecting to MongoDB...');

      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering
      };

      this.mongoClient = await mongoose.connect(
        config.database.mongoUri,
        options
      );

      // Connection event listeners
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
        this.isConnected = true;
      });

      mongoose.connection.on('error', err => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
        this.isConnected = false;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnectMongoDB();
        process.exit(0);
      });

      return this.mongoClient;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Connect to Redis
   */
  async connectRedis() {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        return this.redisClient;
      }

      console.log('🔄 Connecting to Redis...');

      this.redisClient = createClient({
        url: config.database.redisUrl,
      });

      // Redis event listeners
      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.redisClient.on('ready', () => {
        console.log('✅ Redis client ready');
      });

      this.redisClient.on('error', err => {
        console.error('❌ Redis Client Error:', err);
      });

      this.redisClient.on('end', () => {
        console.log('⚠️  Redis connection ended');
      });

      await this.redisClient.connect();

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnectRedis();
      });

      return this.redisClient;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Get MongoDB connection status
   */
  getMongoStatus() {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };
  }

  /**
   * Get Redis connection status
   */
  getRedisStatus() {
    return {
      connected: this.redisClient?.isOpen || false,
      ready: this.redisClient?.isReady || false,
    };
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnectMongoDB() {
    try {
      if (this.mongoClient) {
        await mongoose.connection.close();
        console.log('✅ MongoDB disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting MongoDB:', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnectRedis() {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.quit();
        console.log('✅ Redis disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting Redis:', error);
    }
  }

  /**
   * Health check for both databases
   */
  async healthCheck() {
    const health = {
      mongodb: false,
      redis: false,
      timestamp: new Date().toISOString(),
    };

    try {
      // MongoDB health check
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        health.mongodb = true;
      }
    } catch (error) {
      console.error('MongoDB health check failed:', error);
    }

    try {
      // Redis health check
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return health;
  }

  /**
   * Initialize all database connections
   */
  async initialize() {
    try {
      console.log('🚀 Initializing database connections...');

      // Connect to MongoDB
      await this.connectMongoDB();

      // Connect to Redis (if configured)
      if (config.database.redisUrl) {
        await this.connectRedis();
      } else {
        console.log('⚠️  Redis URL not configured, skipping Redis connection');
      }

      console.log('✅ All database connections initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database connections:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseConfig();
