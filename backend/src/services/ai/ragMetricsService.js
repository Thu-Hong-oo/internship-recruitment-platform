/**
 * 📊 RAG Metrics Service
 * 
 * Track và monitor performance của RAG recommendation system
 */

const { logger } = require('../../utils/logger');

class RAGMetricsService {
  constructor() {
    this.metrics = {
      recommendations: {
        total: 0,
        candidateRecommendations: 0,
        jobRecommendations: 0,
        weightedOnly: 0,
        ragHybrid: 0
      },
      performance: {
        avgResponseTime: 0,
        weightedAvgTime: 0,
        ragAvgTime: 0,
        cacheHitRate: 0,
        chromaDBHitRate: 0
      },
      quality: {
        avgMatchScore: 0,
        hiddenGemsFound: 0,
        semanticDropped: 0,
        tierDistribution: {
          A: 0,
          B: 0,
          C: 0,
          D: 0
        }
      },
      errors: {
        total: 0,
        embeddingErrors: 0,
        chromaDBErrors: 0,
        fallbackCount: 0
      }
    };

    // Reset metrics daily
    this.resetInterval = setInterval(() => {
      this.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Track recommendation request
   */
  trackRecommendation(type, method, responseTime, result) {
    this.metrics.recommendations.total++;
    
    if (type === 'candidate') {
      this.metrics.recommendations.candidateRecommendations++;
    } else if (type === 'job') {
      this.metrics.recommendations.jobRecommendations++;
    }

    if (method === 'rag-hybrid') {
      this.metrics.recommendations.ragHybrid++;
      this._updateAvgTime('rag', responseTime);
    } else {
      this.metrics.recommendations.weightedOnly++;
      this._updateAvgTime('weighted', responseTime);
    }

    // Update overall average
    this._updateAvgTime('overall', responseTime);

    // Track quality metrics
    if (result && result.recommendations) {
      this._trackQualityMetrics(result.recommendations);
    }
  }

  /**
   * Track cache hit/miss
   */
  trackCache(hit) {
    const total = this.metrics.performance.cacheHitRate * 100 + (hit ? 1 : 0);
    const count = this.metrics.recommendations.total;
    this.metrics.performance.cacheHitRate = count > 0 ? (total / count) : 0;
  }

  /**
   * Track ChromaDB hit/miss
   */
  trackChromaDB(hit) {
    const total = this.metrics.performance.chromaDBHitRate * 100 + (hit ? 1 : 0);
    const count = this.metrics.recommendations.ragHybrid;
    this.metrics.performance.chromaDBHitRate = count > 0 ? (total / count) : 0;
  }

  /**
   * Track error
   */
  trackError(type, error) {
    this.metrics.errors.total++;
    
    if (type === 'embedding') {
      this.metrics.errors.embeddingErrors++;
    } else if (type === 'chromaDB') {
      this.metrics.errors.chromaDBErrors++;
    } else if (type === 'fallback') {
      this.metrics.errors.fallbackCount++;
    }

    logger.error(`RAG Error [${type}]:`, error.message);
  }

  /**
   * Update average time
   */
  _updateAvgTime(type, time) {
    const key = type === 'overall' ? 'avgResponseTime' : 
                type === 'rag' ? 'ragAvgTime' : 'weightedAvgTime';
    
    const current = this.metrics.performance[key];
    const count = type === 'overall' ? this.metrics.recommendations.total :
                  type === 'rag' ? this.metrics.recommendations.ragHybrid :
                  this.metrics.recommendations.weightedOnly;

    if (count > 0) {
      this.metrics.performance[key] = Math.round(
        (current * (count - 1) + time) / count
      );
    }
  }

  /**
   * Track quality metrics
   */
  _trackQualityMetrics(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return;
    }

    let totalScore = 0;
    let hiddenGems = 0;

    recommendations.forEach(rec => {
      totalScore += rec.matchScore || 0;
      if (rec.isHiddenGem) {
        hiddenGems++;
      }
      if (rec.tier) {
        this.metrics.quality.tierDistribution[rec.tier] = 
          (this.metrics.quality.tierDistribution[rec.tier] || 0) + 1;
      }
    });

    const count = recommendations.length;
    this.metrics.quality.avgMatchScore = Math.round(totalScore / count);
    this.metrics.quality.hiddenGemsFound += hiddenGems;
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    return {
      ...this.metrics,
      performance: {
        ...this.metrics.performance,
        cacheHitRate: `${this.metrics.performance.cacheHitRate.toFixed(2)}%`,
        chromaDBHitRate: `${this.metrics.performance.chromaDBHitRate.toFixed(2)}%`
      },
      quality: {
        ...this.metrics.quality,
        hiddenGemsPercentage: this.metrics.recommendations.ragHybrid > 0
          ? `${((this.metrics.quality.hiddenGemsFound / this.metrics.recommendations.ragHybrid) * 100).toFixed(2)}%`
          : '0%'
      }
    };
  }

  /**
   * Reset daily metrics (keep totals)
   */
  resetDailyMetrics() {
    logger.info('🔄 Resetting daily RAG metrics...');
    
    // Keep totals, reset daily counters
    this.metrics.quality.hiddenGemsFound = 0;
    this.metrics.quality.semanticDropped = 0;
    this.metrics.errors.total = 0;
    this.metrics.errors.embeddingErrors = 0;
    this.metrics.errors.chromaDBErrors = 0;
    this.metrics.errors.fallbackCount = 0;
  }

  /**
   * Reset all metrics
   */
  resetAll() {
    this.metrics = {
      recommendations: {
        total: 0,
        candidateRecommendations: 0,
        jobRecommendations: 0,
        weightedOnly: 0,
        ragHybrid: 0
      },
      performance: {
        avgResponseTime: 0,
        weightedAvgTime: 0,
        ragAvgTime: 0,
        cacheHitRate: 0,
        chromaDBHitRate: 0
      },
      quality: {
        avgMatchScore: 0,
        hiddenGemsFound: 0,
        semanticDropped: 0,
        tierDistribution: {
          A: 0,
          B: 0,
          C: 0,
          D: 0
        }
      },
      errors: {
        total: 0,
        embeddingErrors: 0,
        chromaDBErrors: 0,
        fallbackCount: 0
      }
    };
  }

  /**
   * Destroy service
   */
  destroy() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
  }
}

// Singleton instance
let instance = null;

function getRAGMetricsService() {
  if (!instance) {
    instance = new RAGMetricsService();
  }
  return instance;
}

module.exports = {
  RAGMetricsService,
  getRAGMetricsService
};

