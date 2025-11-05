const { createClient } = require('redis');
const OTPService = require('../services/external/core/OTPService');
const OTPCooldownService = require('../services/external/core/OTPCooldownService');
const { logger } = require('../../shared/utils/logger');
require('dotenv').config();
let otpService = null;
let otpCooldownService = null;

/**
 * Initialize Redis-based services (OTP, cooldown) using an existing Redis client
 * If no client is passed, a new client will be created and connected.
 *
 * @param {import('redis').RedisClientType?} existingClient
 */
const initializeRedisServices = async (existingClient = null) => {
  try {
    let redisClient = existingClient;

    if (!redisClient) {
      // Only create/connect a new client when one wasn't provided by the caller
      redisClient = createClient({
        url: process.env.REDIS_URL,
      });
      redisClient.on('error', err => {
        logger.error('Redis Client Error', { error: err.message });
      });

      logger.info('Attempting to connect to Redis (initializeServices)...');
      await redisClient.connect();
      logger.info('Redis connected successfully (initializeServices)');
    } else {
      logger.info('Using existing Redis client for initializeServices');
    }

    otpService = new OTPService(redisClient);
    otpCooldownService = new OTPCooldownService(redisClient);

    logger.info('Initializing OTP service...');
    await otpService.initialize();
    logger.info('OTP service initialized successfully');

    logger.info('Redis services initialized successfully');
  } catch (error) {
    console.error('DETAILED ERROR in initializeRedisServices:', error);
    console.error('Failed to initialize Redis services:', error.message);
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
