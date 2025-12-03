/**
 * Auto Retrain Service
 * 
 * Tự động retrain models khi:
 * - Có đủ dữ liệu mới
 * - Model performance degraded
 * - Scheduled retraining
 */

const { logger } = require('../../utils/logger');
const TrainingData = require('../../models/TrainingData');
const Model = require('../../models/Model');
const dataCollectionService = require('../training/dataCollectionService');
const modelManager = require('../training/modelManager');
const PredictionLog = require('../../models/PredictionLog');

class AutoRetrainService {
  constructor() {
    this.minDataForRetrain = 100; // Minimum new data samples for retraining
    this.minPerformanceThreshold = 0.7; // Minimum F1 score to trigger retraining
    this.lastRetrainDate = new Date(0); // Track last retrain date
  }

  /**
   * Check retrain conditions
   */
  async checkRetrainConditions(modelType) {
    try {
      logger.info('Checking retrain conditions...', { modelType });

      // Check 1: Enough new data collected
      const newDataCount = await TrainingData.countDocuments({
        type: this._mapModelTypeToDataType(modelType),
        createdAt: { $gte: this.lastRetrainDate }
      });

      if (newDataCount >= this.minDataForRetrain) {
        logger.info('Enough new data for retraining', {
          modelType,
          newDataCount,
          threshold: this.minDataForRetrain
        });
        return { shouldRetrain: true, reason: 'enough_data', dataCount: newDataCount };
      }

      // Check 2: Model performance degraded
      const currentModel = await modelManager.getActiveModel(modelType);
      if (currentModel) {
        const currentMetrics = await this.evaluateCurrentModel(currentModel);
        
        if (currentMetrics.f1Score < this.minPerformanceThreshold) {
          logger.warn('Model performance below threshold', {
            modelType,
            f1Score: currentMetrics.f1Score,
            threshold: this.minPerformanceThreshold
          });
          return { shouldRetrain: true, reason: 'performance_degraded', metrics: currentMetrics };
        }
      }

      return { shouldRetrain: false };
    } catch (error) {
      logger.error('Error checking retrain conditions:', error);
      throw error;
    }
  }

  /**
   * Trigger retraining
   */
  async triggerRetrain(modelType) {
    try {
      logger.info('Triggering automatic retraining...', { modelType });

      // Collect all training data
      const trainingData = await this.collectTrainingData(modelType);

      if (trainingData.length < this.minDataForRetrain) {
        logger.warn('Not enough training data', {
          modelType,
          dataCount: trainingData.length,
          threshold: this.minDataForRetrain
        });
        return { success: false, reason: 'insufficient_data' };
      }

      // Train new model (this would call actual training script)
      const newModel = await this.trainModel(modelType, trainingData);

      // Evaluate new model
      const metrics = await this.evaluateModel(newModel, trainingData.slice(0, 100)); // Use subset for evaluation

      // Compare with current model
      const currentModel = await modelManager.getActiveModel(modelType);
      let shouldDeploy = true;

      if (currentModel) {
        const currentMetrics = await this.evaluateModel(currentModel, trainingData.slice(0, 100));
        
        if (metrics.f1Score > currentMetrics.f1Score) {
          logger.info('New model is better, deploying...', {
            newF1: metrics.f1Score,
            currentF1: currentMetrics.f1Score
          });
        } else {
          logger.info('New model not better, keeping current', {
            newF1: metrics.f1Score,
            currentF1: currentMetrics.f1Score
          });
          shouldDeploy = false;
        }
      }

      // If new model is better, deploy it
      if (shouldDeploy) {
        await modelManager.deployModel(newModel._id);
        this.lastRetrainDate = new Date();
        logger.info('New model deployed successfully', {
          modelId: newModel._id,
          modelType
        });
      }

      return {
        success: true,
        modelId: newModel._id,
        metrics,
        deployed: shouldDeploy
      };
    } catch (error) {
      logger.error('Error triggering retrain:', error);
      throw error;
    }
  }

  /**
   * Collect training data for model type
   */
  async collectTrainingData(modelType) {
    try {
      const dataType = this._mapModelTypeToDataType(modelType);
      
      // Collect from different sources
      const cvData = dataType === 'cv_parsing' 
        ? await dataCollectionService.collectCVParsingData({ limit: 1000 })
        : [];
      
      const matchingData = dataType === 'job_matching'
        ? await dataCollectionService.collectJobMatchingData({ limit: 1000 })
        : [];
      
      const feedbackData = await dataCollectionService.collectFeedbackData({
        type: dataType,
        significantOnly: true,
        limit: 500
      });

      // Combine all data
      const allData = [...cvData, ...matchingData, ...feedbackData];

      // Save to training data collection
      if (allData.length > 0) {
        await dataCollectionService.saveTrainingData(allData);
      }

      return allData;
    } catch (error) {
      logger.error('Error collecting training data:', error);
      throw error;
    }
  }

  /**
   * Train model (placeholder - would call actual training script)
   */
  async trainModel(modelType, trainingData) {
    try {
      // This would call the actual Python training script
      // For now, create a placeholder model record
      logger.info('Training model...', { modelType, dataSize: trainingData.length });

      // In production, this would:
      // 1. Save training data to file
      // 2. Call Python training script
      // 3. Load trained model
      // 4. Evaluate model
      // 5. Save model to database

      const model = await modelManager.saveModel({
        name: `${modelType}-model`,
        version: `v${Date.now()}`,
        type: modelType,
        path: `models/${modelType}-${Date.now()}.bin`,
        trainingDataSize: trainingData.length,
        metrics: {
          f1Score: 0.85, // Placeholder
          accuracy: 0.88,
          precision: 0.83,
          recall: 0.87
        }
      });

      return model;
    } catch (error) {
      logger.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Evaluate model
   */
  async evaluateModel(model, testData) {
    try {
      // This would actually evaluate the model
      // For now, return stored metrics
      return {
        f1Score: model.metrics.f1Score || 0,
        accuracy: model.metrics.accuracy || 0,
        precision: model.metrics.precision || 0,
        recall: model.metrics.recall || 0
      };
    } catch (error) {
      logger.error('Error evaluating model:', error);
      throw error;
    }
  }

  /**
   * Evaluate current model performance
   */
  async evaluateCurrentModel(model) {
    try {
      // Get recent prediction logs
      const recentLogs = await PredictionLog.find({
        modelId: model._id,
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }).limit(1000);

      if (recentLogs.length === 0) {
        return model.metrics; // Return stored metrics if no logs
      }

      // Calculate metrics from logs
      const successful = recentLogs.filter(log => log.success).length;
      const avgConfidence = recentLogs
        .filter(log => log.confidence !== null)
        .reduce((sum, log) => sum + log.confidence, 0) / recentLogs.length;

      return {
        f1Score: model.metrics.f1Score || 0.8, // Use stored or default
        accuracy: successful / recentLogs.length,
        precision: model.metrics.precision || 0.8,
        recall: model.metrics.recall || 0.8,
        avgConfidence: avgConfidence || 0.8
      };
    } catch (error) {
      logger.error('Error evaluating current model:', error);
      return model.metrics; // Return stored metrics on error
    }
  }

  /**
   * Map model type to training data type
   */
  _mapModelTypeToDataType(modelType) {
    const mapping = {
      'embedding': 'job_matching',
      'ner': 'cv_parsing',
      'classifier': 'experience_classification',
      'llm': 'cv_parsing'
    };
    return mapping[modelType] || 'cv_parsing';
  }
}

module.exports = new AutoRetrainService();

