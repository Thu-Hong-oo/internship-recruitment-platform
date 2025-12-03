/**
 * Model Monitoring Service
 * 
 * Monitor model performance:
 * - Track predictions
 * - Calculate statistics
 * - Detect anomalies
 * - Performance metrics
 */

const { logger } = require('../../utils/logger');
const PredictionLog = require('../../models/PredictionLog');
const Model = require('../../models/Model');

class ModelMonitoringService {
  constructor() {
    this.baselineConfidence = 0.8;
    this.baselineLatency = 1000; // milliseconds
    this.baselineErrorRate = 0.05; // 5%
  }

  /**
   * Track prediction
   */
  async trackPrediction(prediction) {
    try {
      const {
        modelId,
        modelVersion,
        modelType,
        input,
        output,
        confidence = null,
        latency,
        success = true,
        error = null,
        userId = null
      } = prediction;

      const log = await PredictionLog.create({
        modelId,
        modelVersion,
        modelType,
        input,
        output,
        confidence,
        latency,
        success,
        error,
        userId,
        timestamp: new Date()
      });

      return log;
    } catch (error) {
      logger.error('Error tracking prediction:', error);
      // Don't throw - monitoring should not break main flow
    }
  }

  /**
   * Get model statistics
   */
  async getModelStats(modelId, timeRange = '7d') {
    try {
      const startDate = this.getTimeRangeStart(timeRange);

      const logs = await PredictionLog.find({
        modelId,
        timestamp: { $gte: startDate }
      }).lean();

      if (logs.length === 0) {
        return {
          totalPredictions: 0,
          avgConfidence: 0,
          avgLatency: 0,
          errorRate: 0,
          predictionsByDay: []
        };
      }

      const successful = logs.filter(log => log.success);
      const withConfidence = logs.filter(log => log.confidence !== null);

      return {
        totalPredictions: logs.length,
        successfulPredictions: successful.length,
        failedPredictions: logs.length - successful.length,
        avgConfidence: withConfidence.length > 0
          ? withConfidence.reduce((sum, log) => sum + log.confidence, 0) / withConfidence.length
          : 0,
        avgLatency: logs.reduce((sum, log) => sum + log.latency, 0) / logs.length,
        errorRate: (logs.length - successful.length) / logs.length,
        predictionsByDay: this.groupByDay(logs)
      };
    } catch (error) {
      logger.error('Error getting model stats:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(modelId) {
    try {
      const stats = await this.getModelStats(modelId, '7d');

      const anomalies = [];

      // Check if confidence dropped
      if (stats.avgConfidence < this.baselineConfidence * 0.9) {
        anomalies.push({
          type: 'low_confidence',
          message: 'Model confidence dropped significantly',
          severity: 'high',
          current: stats.avgConfidence,
          baseline: this.baselineConfidence
        });
      }

      // Check if latency increased
      if (stats.avgLatency > this.baselineLatency * 1.5) {
        anomalies.push({
          type: 'high_latency',
          message: 'Model latency increased significantly',
          severity: 'medium',
          current: stats.avgLatency,
          baseline: this.baselineLatency
        });
      }

      // Check if error rate increased
      if (stats.errorRate > this.baselineErrorRate * 1.5) {
        anomalies.push({
          type: 'high_error_rate',
          message: 'Model error rate increased',
          severity: 'high',
          current: stats.errorRate,
          baseline: this.baselineErrorRate
        });
      }

      // Check if prediction count dropped significantly
      const previousWeekStats = await this.getModelStats(modelId, '14d');
      if (previousWeekStats.totalPredictions > 0) {
        const dropRate = (previousWeekStats.totalPredictions - stats.totalPredictions) / previousWeekStats.totalPredictions;
        if (dropRate > 0.5) {
          anomalies.push({
            type: 'low_usage',
            message: 'Model usage dropped significantly',
            severity: 'low',
            current: stats.totalPredictions,
            previous: previousWeekStats.totalPredictions
          });
        }
      }

      return anomalies;
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Get time range start date
   */
  getTimeRangeStart(timeRange) {
    const now = new Date();
    const days = parseInt(timeRange) || 7;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return startDate;
  }

  /**
   * Group logs by day
   */
  groupByDay(logs) {
    const grouped = {};

    logs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = 0;
      }
      grouped[date]++;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate average
   */
  calculateAvg(logs, field) {
    const values = logs
      .map(log => log[field])
      .filter(val => val !== null && val !== undefined);

    if (values.length === 0) return 0;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate(logs) {
    if (logs.length === 0) return 0;

    const errors = logs.filter(log => !log.success).length;
    return errors / logs.length;
  }

  /**
   * Get all model stats
   */
  async getAllModelStats(timeRange = '7d') {
    try {
      const models = await Model.find({ active: true }).lean();

      const stats = await Promise.all(
        models.map(async (model) => {
          const modelStats = await this.getModelStats(model._id, timeRange);
          const anomalies = await this.detectAnomalies(model._id);

          return {
            modelId: model._id,
            modelName: model.name,
            modelVersion: model.version,
            modelType: model.type,
            stats: modelStats,
            anomalies
          };
        })
      );

      return stats;
    } catch (error) {
      logger.error('Error getting all model stats:', error);
      throw error;
    }
  }
}

module.exports = new ModelMonitoringService();

