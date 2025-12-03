/**
 * Scheduled Data Collection Service
 * 
 * Automatically collect training data on a schedule:
 * - Daily collection of CV parsing data
 * - Daily collection of job matching data
 * - Daily collection of feedback data
 */

const cron = require('node-cron');
const { logger } = require('../../utils/logger.js');
const dataCollectionService = require('./dataCollectionService.js');

class ScheduledDataCollectionService {
  constructor() {
    this.isRunning = false;
    this.lastCollectionDate = null;
  }

  /**
   * Start scheduled data collection
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduled data collection is already running');
      return;
    }

    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.collectAllTrainingData();
    });

    // Also run on startup (optional, for immediate collection)
    if (process.env.AUTO_COLLECT_ON_STARTUP === 'true') {
      logger.info('Auto-collecting training data on startup...');
      this.collectAllTrainingData().catch(err => {
        logger.error('Error collecting training data on startup:', err);
      });
    }

    this.isRunning = true;
    logger.info('Scheduled data collection started (daily at 2 AM)');
  }

  /**
   * Stop scheduled data collection
   */
  stop() {
    this.isRunning = false;
    logger.info('Scheduled data collection stopped');
  }

  /**
   * Collect all training data
   */
  async collectAllTrainingData() {
    try {
      logger.info('Starting scheduled training data collection...');
      const startTime = Date.now();

      // 1. Collect CV parsing data
      let cvDataCount = 0;
      try {
        const cvData = await dataCollectionService.collectCVParsingData({
          limit: 1000,
          minQuality: 0.7,
          verifiedOnly: false,
        });
        
        if (cvData.length > 0) {
          await dataCollectionService.saveTrainingData(cvData);
          cvDataCount = cvData.length;
          logger.info(`Collected ${cvDataCount} CV parsing training samples`);
        }
      } catch (cvError) {
        logger.error('Error collecting CV parsing data:', cvError);
      }

      // 2. Collect job matching data
      let jobMatchingCount = 0;
      try {
        const jobMatchingData = await dataCollectionService.collectJobMatchingData({
          limit: 1000,
          includeOutcomes: true,
        });
        
        if (jobMatchingData.length > 0) {
          await dataCollectionService.saveTrainingData(jobMatchingData);
          jobMatchingCount = jobMatchingData.length;
          logger.info(`Collected ${jobMatchingCount} job matching training samples`);
        }
      } catch (jobError) {
        logger.error('Error collecting job matching data:', jobError);
      }

      // 3. Collect feedback data
      let feedbackCount = 0;
      try {
        const feedbackData = await dataCollectionService.collectFeedbackData({
          significantOnly: true,
          limit: 1000,
        });
        
        if (feedbackData.length > 0) {
          await dataCollectionService.saveTrainingData(feedbackData);
          feedbackCount = feedbackData.length;
          logger.info(`Collected ${feedbackCount} feedback training samples`);
        }
      } catch (feedbackError) {
        logger.error('Error collecting feedback data:', feedbackError);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const totalCollected = cvDataCount + jobMatchingCount + feedbackCount;

      logger.info('Scheduled training data collection completed', {
        duration: `${duration}s`,
        cvParsing: cvDataCount,
        jobMatching: jobMatchingCount,
        feedback: feedbackCount,
        total: totalCollected,
      });

      this.lastCollectionDate = new Date();
      return {
        cvParsing: cvDataCount,
        jobMatching: jobMatchingCount,
        feedback: feedbackCount,
        total: totalCollected,
        duration: `${duration}s`,
      };
    } catch (error) {
      logger.error('Error in scheduled training data collection:', error);
      throw error;
    }
  }

  /**
   * Get collection status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCollectionDate: this.lastCollectionDate,
      nextCollectionTime: this.isRunning ? 'Daily at 2 AM' : 'Not scheduled',
    };
  }
}

// Singleton
let instance = null;

function getScheduledDataCollectionService() {
  if (!instance) {
    instance = new ScheduledDataCollectionService();
  }
  return instance;
}

module.exports = {
  ScheduledDataCollectionService,
  getScheduledDataCollectionService,
};

