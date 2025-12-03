/**
 * Model Manager Service
 * 
 * Quản lý versions của models:
 * - Save models
 * - Get best model
 * - Deploy models
 * - Compare models
 * - A/B testing
 */

const { logger } = require('../../utils/logger');
const Model = require('../../models/Model');
const fs = require('fs').promises;
const path = require('path');

class ModelManager {
  constructor() {
    this.modelsDir = path.join(__dirname, '../../../models');
    this.ensureModelsDir();
  }

  /**
   * Ensure models directory exists
   */
  async ensureModelsDir() {
    try {
      await fs.mkdir(this.modelsDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating models directory:', error);
    }
  }

  /**
   * Save model to database
   */
  async saveModel(modelData) {
    try {
      const model = await Model.create({
        name: modelData.name,
        version: modelData.version,
        type: modelData.type, // 'embedding', 'ner', 'classifier'
        path: modelData.path,
        baseModel: modelData.baseModel || null,
        metrics: modelData.metrics || {}, // accuracy, f1-score, etc.
        trainingDataSize: modelData.trainingDataSize || 0,
        trainingConfig: modelData.trainingConfig || {},
        notes: modelData.notes || '',
        active: false // New models are not active by default
      });

      logger.info('Model saved to database', {
        modelId: model._id,
        name: model.name,
        version: model.version,
        type: model.type
      });

      return model;
    } catch (error) {
      logger.error('Error saving model:', error);
      throw error;
    }
  }

  /**
   * Get best model by type
   */
  async getBestModel(type) {
    try {
      const model = await Model.findOne({ type })
        .sort({ 'metrics.f1Score': -1 })
        .limit(1);

      return model;
    } catch (error) {
      logger.error('Error getting best model:', error);
      throw error;
    }
  }

  /**
   * Get active model by type
   */
  async getActiveModel(type) {
    try {
      const model = await Model.findOne({ type, active: true });

      return model;
    } catch (error) {
      logger.error('Error getting active model:', error);
      throw error;
    }
  }

  /**
   * Deploy model (set as active)
   */
  async deployModel(modelId) {
    try {
      const model = await Model.findById(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Deactivate all other models of the same type
      await Model.updateMany(
        { type: model.type, active: true },
        { active: false }
      );

      // Activate this model
      await Model.findByIdAndUpdate(modelId, {
        active: true,
        deployedAt: new Date()
      });

      logger.info('Model deployed successfully', {
        modelId: model._id,
        name: model.name,
        version: model.version,
        type: model.type
      });

      // Reload model in service (if needed)
      await this.reloadModel(model);

      return model;
    } catch (error) {
      logger.error('Error deploying model:', error);
      throw error;
    }
  }

  /**
   * Reload model in service
   */
  async reloadModel(model) {
    try {
      // This would reload the model in the actual service
      // Implementation depends on the service type
      logger.info('Model reloaded in service', {
        modelId: model._id,
        type: model.type
      });
    } catch (error) {
      logger.error('Error reloading model:', error);
      throw error;
    }
  }

  /**
   * Compare two models
   */
  async compareModels(modelId1, modelId2, testData = null) {
    try {
      const model1 = await Model.findById(modelId1);
      const model2 = await Model.findById(modelId2);

      if (!model1 || !model2) {
        throw new Error('One or both models not found');
      }

      if (model1.type !== model2.type) {
        throw new Error('Cannot compare models of different types');
      }

      // If test data provided, evaluate both models
      let results1 = null;
      let results2 = null;

      if (testData) {
        results1 = await this.evaluateModel(model1, testData);
        results2 = await this.evaluateModel(model2, testData);
      } else {
        // Use stored metrics
        results1 = {
          f1Score: model1.metrics.f1Score || 0,
          accuracy: model1.metrics.accuracy || 0,
          precision: model1.metrics.precision || 0,
          recall: model1.metrics.recall || 0
        };
        results2 = {
          f1Score: model2.metrics.f1Score || 0,
          accuracy: model2.metrics.accuracy || 0,
          precision: model2.metrics.precision || 0,
          recall: model2.metrics.recall || 0
        };
      }

      const comparison = {
        model1: {
          id: model1._id,
          name: model1.name,
          version: model1.version,
          metrics: results1
        },
        model2: {
          id: model2._id,
          name: model2.name,
          version: model2.version,
          metrics: results2
        },
        winner: results1.f1Score > results2.f1Score ? modelId1 : modelId2,
        improvement: {
          f1Score: Math.abs(results1.f1Score - results2.f1Score),
          accuracy: Math.abs(results1.accuracy - results2.accuracy)
        }
      };

      return comparison;
    } catch (error) {
      logger.error('Error comparing models:', error);
      throw error;
    }
  }

  /**
   * Evaluate model on test data
   */
  async evaluateModel(model, testData) {
    try {
      // This would actually evaluate the model
      // Implementation depends on model type
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
   * Get all models by type
   */
  async getModelsByType(type, options = {}) {
    try {
      const {
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      const models = await Model.find({ type })
        .sort({ [sortBy]: sortOrder })
        .limit(limit);

      return models;
    } catch (error) {
      logger.error('Error getting models by type:', error);
      throw error;
    }
  }

  /**
   * Delete model
   */
  async deleteModel(modelId) {
    try {
      const model = await Model.findById(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Don't delete if active
      if (model.active) {
        throw new Error('Cannot delete active model. Deactivate it first.');
      }

      // Delete model file if exists
      try {
        const modelPath = path.join(this.modelsDir, model.path);
        await fs.unlink(modelPath);
      } catch (error) {
        logger.warn('Model file not found or already deleted:', error.message);
      }

      // Delete from database
      await Model.findByIdAndDelete(modelId);

      logger.info('Model deleted', { modelId, name: model.name, version: model.version });
      return true;
    } catch (error) {
      logger.error('Error deleting model:', error);
      throw error;
    }
  }
}

module.exports = new ModelManager();

