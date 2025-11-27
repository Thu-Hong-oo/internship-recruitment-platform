const { createClient } = require('redis');
const OTPService = require('../services/auth/otpService');
const OTPCooldownService = require('../services/auth/otpCooldownService');
const { initializeCacheService } = require('../services/cache/cacheService');
const { logger } = require('../utils/logger');
require('dotenv').config();
let otpService = null;
let otpCooldownService = null;
let cacheService = null;

const initializeRedisServices = async () => {
  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL,
  
      
    });
  console.log("Testnnesedii",process.env.REDIS_URL);
    redisClient.on('error', err => {
      logger.error('Redis Client Error', { error: err.message });
    });

    await redisClient.connect();

    otpService = new OTPService(redisClient);
    otpCooldownService = new OTPCooldownService(redisClient);
    await otpService.initialize();

    // Initialize cache service
    cacheService = await initializeCacheService(redisClient);

    logger.info('Redis services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis services', {
      error: error.message,
    });
    otpService = null;
    otpCooldownService = null;
  }
};

const getOTPService = () => {
  return otpService;
};

const getOTPCooldownService = () => {
  return otpCooldownService;
};

const getCacheService = () => {
  return cacheService;
};

module.exports = {
  initializeRedisServices,
  getOTPService,
  getOTPCooldownService,
  getCacheService,
};
