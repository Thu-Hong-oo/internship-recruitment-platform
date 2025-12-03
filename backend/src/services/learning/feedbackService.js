/**
 * Feedback Service
 * 
 * Thu thập và xử lý feedback từ users:
 * - Collect user corrections
 * - Determine if correction is significant
 * - Add to training data
 */

const { logger } = require('../../utils/logger');
const Feedback = require('../../models/Feedback');
const TrainingData = require('../../models/TrainingData');

class FeedbackService {
  constructor() {
    this.significanceThreshold = 0.7; // Similarity threshold for significant corrections
  }

  /**
   * Collect user feedback
   */
  async collectUserFeedback(feedbackData) {
    try {
      const {
        type,
        input,
        predictedOutput,
        userCorrection,
        userId,
        modelId = null,
        modelVersion = null,
        confidence = null
      } = feedbackData;

      // Check if correction is significant
      const isSignificant = this.isSignificantCorrection(
        predictedOutput,
        userCorrection
      );

      const feedback = await Feedback.create({
        type,
        input,
        predictedOutput,
        userCorrection,
        userId,
        modelId,
        modelVersion,
        confidence,
        isSignificant,
        addedToTraining: false,
        timestamp: new Date()
      });

      logger.info('User feedback collected', {
        feedbackId: feedback._id,
        type,
        isSignificant,
        userId
      });

      // If significant, add to training data
      if (isSignificant) {
        await this.addToTrainingData(feedback);
      }

      return feedback;
    } catch (error) {
      logger.error('Error collecting user feedback:', error);
      throw error;
    }
  }

  /**
   * Check if correction is significant
   */
  isSignificantCorrection(predictedOutput, userCorrection) {
    if (!userCorrection || !predictedOutput) {
      return false;
    }

    // Calculate similarity between predicted and corrected output
    const similarity = this.calculateSimilarity(predictedOutput, userCorrection);

    // If similarity is low, correction is significant
    return similarity < this.significanceThreshold;
  }

  /**
   * Calculate similarity between two outputs
   */
  calculateSimilarity(output1, output2) {
    try {
      // Convert to strings for comparison
      const str1 = JSON.stringify(output1);
      const str2 = JSON.stringify(output2);

      if (str1 === str2) {
        return 1.0; // Identical
      }

      // Simple Jaccard similarity on words
      const words1 = new Set(str1.toLowerCase().split(/\W+/));
      const words2 = new Set(str2.toLowerCase().split(/\W+/));

      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);

      return intersection.size / union.size;
    } catch (error) {
      logger.error('Error calculating similarity:', error);
      return 0; // If error, assume different
    }
  }

  /**
   * Add feedback to training data
   */
  async addToTrainingData(feedback) {
    try {
      // Check if already added
      if (feedback.addedToTraining) {
        return;
      }

      const trainingData = await TrainingData.create({
        type: feedback.type,
        input: feedback.input,
        output: feedback.userCorrection || feedback.predictedOutput,
        metadata: {
          source: 'user_feedback',
          timestamp: feedback.timestamp,
          quality: 1.0, // User corrections are high quality
          verified: true,
          userId: feedback.userId
        }
      });

      // Mark feedback as added
      await Feedback.findByIdAndUpdate(feedback._id, {
        addedToTraining: true
      });

      logger.info('Feedback added to training data', {
        feedbackId: feedback._id,
        trainingDataId: trainingData._id
      });

      return trainingData;
    } catch (error) {
      logger.error('Error adding feedback to training data:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(options = {}) {
    try {
      const {
        type = null,
        userId = null,
        timeRange = '30d'
      } = options;

      const query = {};
      if (type) query.type = type;
      if (userId) query.userId = userId;

      // Time range
      const days = parseInt(timeRange) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query.timestamp = { $gte: startDate };

      const total = await Feedback.countDocuments(query);
      const significant = await Feedback.countDocuments({ ...query, isSignificant: true });
      const addedToTraining = await Feedback.countDocuments({ ...query, addedToTraining: true });

      return {
        total,
        significant,
        addedToTraining,
        significantRate: total > 0 ? significant / total : 0,
        trainingRate: total > 0 ? addedToTraining / total : 0
      };
    } catch (error) {
      logger.error('Error getting feedback stats:', error);
      throw error;
    }
  }
}

module.exports = new FeedbackService();

