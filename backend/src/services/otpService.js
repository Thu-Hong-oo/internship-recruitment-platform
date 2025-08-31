const { logger } = require('../utils/logger');

class OTPService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
  }

  // Generate OTP key for Redis
  generateOTPKey(type, identifier) {
    return `otp:${type}:${identifier}`;
  }

  // Store OTP in Redis
  async storeOTP(type, identifier, otp) {
    try {
      if (!this.redisClient) {
        throw new Error('Redis client not available');
      }

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
    try {
      if (!this.redisClient) {
        throw new Error('Redis client not available');
      }

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
    try {
      if (!this.redisClient) {
        throw new Error('Redis client not available');
      }

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
    try {
      if (!this.redisClient) {
        return false;
      }

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
    try {
      if (!this.redisClient) {
        return -1;
      }

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
}

module.exports = OTPService;
