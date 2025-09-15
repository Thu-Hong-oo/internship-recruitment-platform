const { createClient } = require('redis');
const OTPService = require('../services/otpService');
const OTPCooldownService = require('../services/otpCooldownService');
const { logger } = require('../utils/logger');

let otpService = null;
let otpCooldownService = null;

const initializeRedisServices = async () => {
  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('error', err => {
      logger.error('Redis Client Error', { error: err.message });
    });

    await redisClient.connect();

    otpService = new OTPService(redisClient);
    otpCooldownService = new OTPCooldownService(redisClient);
    await otpService.initialize();

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

module.exports = {
  initializeRedisServices,
  getOTPService,
  getOTPCooldownService,
};
