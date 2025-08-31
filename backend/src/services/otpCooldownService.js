const { logger } = require('../utils/logger');

class OTPCooldownService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.COOLDOWN_PERIODS = {
      email_verification: 60, // 1 phút cooldown cho email verification
      password_reset: 60, // 1 phút cooldown cho password reset
      resend_verification: 30 // 30 giây cooldown cho resend
    };
  }

  // Generate cooldown key
  generateCooldownKey(type, identifier) {
    return `otp_cooldown:${type}:${identifier}`;
  }

  // Check if user is in cooldown period
  async isInCooldown(type, identifier) {
    try {
      if (!this.redisClient) {
        return false; // No Redis, no cooldown
      }

      const key = this.generateCooldownKey(type, identifier);
      const cooldown = await this.redisClient.get(key);
      
      return cooldown !== null;
    } catch (error) {
      logger.error('Failed to check cooldown', {
        error: error.message,
        type,
        identifier
      });
      return false;
    }
  }

  // Get remaining cooldown time
  async getRemainingCooldown(type, identifier) {
    try {
      if (!this.redisClient) {
        return 0;
      }

      const key = this.generateCooldownKey(type, identifier);
      const ttl = await this.redisClient.ttl(key);
      
      return Math.max(0, ttl);
    } catch (error) {
      logger.error('Failed to get remaining cooldown', {
        error: error.message,
        type,
        identifier
      });
      return 0;
    }
  }

  // Set cooldown for user
  async setCooldown(type, identifier) {
    try {
      if (!this.redisClient) {
        return true; // No Redis, assume success
      }

      const key = this.generateCooldownKey(type, identifier);
      const cooldownPeriod = this.COOLDOWN_PERIODS[type] || 60;
      
      await this.redisClient.setEx(key, cooldownPeriod, '1');
      
      logger.info(`OTP cooldown set`, {
        type,
        identifier,
        cooldownPeriod
      });

      return true;
    } catch (error) {
      logger.error('Failed to set cooldown', {
        error: error.message,
        type,
        identifier
      });
      return false;
    }
  }

  // Clear cooldown for user (for testing or admin purposes)
  async clearCooldown(type, identifier) {
    try {
      if (!this.redisClient) {
        return true;
      }

      const key = this.generateCooldownKey(type, identifier);
      await this.redisClient.del(key);
      
      logger.info(`OTP cooldown cleared`, {
        type,
        identifier
      });

      return true;
    } catch (error) {
      logger.error('Failed to clear cooldown', {
        error: error.message,
        type,
        identifier
      });
      return false;
    }
  }

  // Get cooldown info for debugging
  async getCooldownInfo(type, identifier) {
    try {
      if (!this.redisClient) {
        return {
          inCooldown: false,
          remainingTime: 0,
          cooldownPeriod: this.COOLDOWN_PERIODS[type] || 60
        };
      }

      const key = this.generateCooldownKey(type, identifier);
      const inCooldown = await this.isInCooldown(type, identifier);
      const remainingTime = await this.getRemainingCooldown(type, identifier);
      
      return {
        inCooldown,
        remainingTime,
        cooldownPeriod: this.COOLDOWN_PERIODS[type] || 60
      };
    } catch (error) {
      logger.error('Failed to get cooldown info', {
        error: error.message,
        type,
        identifier
      });
      return {
        inCooldown: false,
        remainingTime: 0,
        cooldownPeriod: this.COOLDOWN_PERIODS[type] || 60
      };
    }
  }
}

module.exports = OTPCooldownService;
