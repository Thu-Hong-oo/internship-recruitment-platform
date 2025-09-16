const { logger } = require('../utils/logger');

class OTPService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.initialized = false;
    this.OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
  }

  async initialize() {
    try {
      if (!this.redisClient) {
        throw new Error('Redis client not provided');
      }
      // Test Redis connection
      await this.redisClient.ping();
      this.initialized = true;
      logger.info('OTP Service initialized successfully');
      return true;
    } catch (error) {
      this.initialized = false;
      logger.error('Failed to initialize OTP Service', { error: error.message });
      throw error;
    }
  }

  checkInitialized() {
    if (!this.initialized || !this.redisClient) {
      throw new Error('OTP Service not initialized or Redis client not available');
    }
  }

  // Generate OTP key for Redis
  generateOTPKey(type, identifier) {
    return `otp:${type}:${identifier}`;
  }

  // Store OTP in Redis
  async storeOTP(type, identifier, otp) {
    this.checkInitialized();
    try {
      const key = this.generateOTPKey(type, identifier);
      await this.redisClient.setEx(key, this.OTP_EXPIRY, otp);
      
      logger.info(`OTP stored in Redis`, {
        type,
        identifier,
        key,
        expiry: this.OTP_EXPIRY
      });

      return true;
    } catch (error) {
      logger.error('Failed to store OTP in Redis', {
        error: error.message,
        type,
        identifier
      });
      throw error;
    }
  }

  // Get OTP from Redis
  async getOTP(type, identifier) {
    this.checkInitialized();
    try {
      const key = this.generateOTPKey(type, identifier);
      const otp = await this.redisClient.get(key);
      
      if (otp) {
        logger.info(`OTP retrieved from Redis`, {
          type,
          identifier,
          key
        });
      }

      return otp;
    } catch (error) {
      logger.error('Failed to get OTP from Redis', {
        error: error.message,
        type,
        identifier
      });
      throw error;
    }
  }

  // Verify and delete OTP from Redis
  async verifyAndDeleteOTP(type, identifier, providedOTP) {
    this.checkInitialized();
    try {
      const key = this.generateOTPKey(type, identifier);
      const storedOTP = await this.redisClient.get(key);

      if (!storedOTP) {
        logger.warn(`OTP not found or expired`, {
          type,
          identifier,
          key
        });
        return false;
      }

      if (storedOTP !== providedOTP.toUpperCase()) {
        logger.warn(`OTP mismatch`, {
          type,
          identifier,
          providedOTP: providedOTP.toUpperCase(),
          storedOTP
        });
        return false;
      }

      // Delete OTP after successful verification
      await this.redisClient.del(key);
      
      logger.info(`OTP verified and deleted`, {
        type,
        identifier,
        key
      });

      return true;
    } catch (error) {
      logger.error('Failed to verify OTP', {
        error: error.message,
        type,
        identifier
      });
      throw error;
    }
  }

  // Delete OTP from Redis (for cleanup)
  async deleteOTP(type, identifier) {
    this.checkInitialized();
    try {
      const key = this.generateOTPKey(type, identifier);
      await this.redisClient.del(key);
      
      logger.info(`OTP deleted from Redis`, {
        type,
        identifier,
        key
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete OTP from Redis', {
        error: error.message,
        type,
        identifier
      });
      return false;
    }
  }

  // Get remaining TTL for OTP
  async getOTPTTL(type, identifier) {
    this.checkInitialized();
    try {
      const key = this.generateOTPKey(type, identifier);
      const ttl = await this.redisClient.ttl(key);
      
      return ttl;
    } catch (error) {
      logger.error('Failed to get OTP TTL', {
        error: error.message,
        type,
        identifier
      });
      return -1;
    }
  }

  /**
   * Set a key-value pair with expiration time
   * @param {string} key - The key to store
   * @param {string} value - The value to store
   * @param {number} expirySeconds - Expiration time in seconds
   */
  async setWithExpiry(key, value, expirySeconds) {
    this.checkInitialized();
    try {
      await this.redisClient.setEx(key, expirySeconds, value);
      logger.info('Data stored in Redis with expiry', {
        key,
        expirySeconds
      });
    } catch (error) {
      logger.error('Redis setWithExpiry error:', {
        error: error.message,
        key
      });
      throw error;
    }
  }

  /**
   * Get a value by key
   * @param {string} key - The key to retrieve
   * @returns {Promise<string|null>} The stored value or null if not found
   */
  async get(key) {
    this.checkInitialized();
    try {
      const value = await this.redisClient.get(key);
      logger.info('Data retrieved from Redis', { key, exists: !!value });
      return value;
    } catch (error) {
      logger.error('Redis get error:', {
        error: error.message,
        key
      });
      throw error;
    }
  }

  /**
   * Delete a key
   * @param {string} key - The key to delete
   */
  async delete(key) {
    this.checkInitialized();
    try {
      await this.redisClient.del(key);
      logger.info('Data deleted from Redis', { key });
    } catch (error) {
      logger.error('Redis delete error:', {
        error: error.message,
        key
      });
      throw error;
    }
  }
}

module.exports = OTPService;

