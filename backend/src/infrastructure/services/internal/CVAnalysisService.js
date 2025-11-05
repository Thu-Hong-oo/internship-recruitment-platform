/**
 * CVAnalysisService - Handles CV analysis operations
 * Dependencies injected via constructor for proper DI
 */
class CVAnalysisService {
  constructor(
    cvAnalysisRepository,
    cvRepository,
    candidateRepository,
    geminiAIService,
    validationService
  ) {
    this.cvAnalysisRepository = cvAnalysisRepository;
    this.cvRepository = cvRepository;
    this.candidateRepository = candidateRepository;
    this.geminiAIService = geminiAIService;
    this.validationService = validationService;
  }

  async analyzeCV(cvId) {
    try {
      // Get CV details
      const cv = await this.cvRepository.findById(cvId);
      if (!cv) {
        throw new Error('CV not found');
      }

      // Check if CV analysis already exists
      const existingAnalysis = await this.cvAnalysisRepository.findOne({
        cvId,
      });
      if (existingAnalysis) {
        throw new Error('CV analysis already exists');
      }

      // Get CV content (this would typically be extracted from the CV file)
      const cvContent = await this.extractCVContent(cv);

      // Analyze CV using Gemini AI
      const analysisResult = await this.geminiAIService.analyzeCV(cvContent);

      // Create CV analysis record
      const cvAnalysis = await this.cvAnalysisRepository.create({
        cvId,
        analysisResult,
        status: 'completed',
        analyzedAt: new Date(),
      });

      // Update CV analysis status
      await this.cvRepository.update(cvId, {
        analysisStatus: 'completed',
      });

      return {
        success: true,
        analysis: {
          id: cvAnalysis._id,
          cvId: cvAnalysis.cvId,
          analysisResult: cvAnalysis.analysisResult,
          status: cvAnalysis.status,
          analyzedAt: cvAnalysis.analyzedAt,
        },
        message: 'CV analysis completed successfully',
      };
    } catch (error) {
      throw new Error(`Analyze CV failed: ${error.message}`);
    }
  }

  async getCVAnalysisById(analysisId) {
    try {
      const analysis = await this.cvAnalysisRepository.findById(analysisId);
      if (!analysis) {
        throw new Error('CV analysis not found');
      }

      return {
        success: true,
        analysis: {
          id: analysis._id,
          cvId: analysis.cvId,
          analysisResult: analysis.analysisResult,
          status: analysis.status,
          analyzedAt: analysis.analyzedAt,
          createdAt: analysis.createdAt,
        },
      };
    } catch (error) {
      throw new Error(`Get CV analysis by ID failed: ${error.message}`);
    }
  }

  async getCVAnalysisByCVId(cvId) {
    try {
      const analysis = await this.cvAnalysisRepository.findOne({ cvId });
      if (!analysis) {
        return {
          success: true,
          analysis: null,
          message: 'No analysis found for this CV',
        };
      }

      return {
        success: true,
        analysis: {
          id: analysis._id,
          cvId: analysis.cvId,
          analysisResult: analysis.analysisResult,
          status: analysis.status,
          analyzedAt: analysis.analyzedAt,
          createdAt: analysis.createdAt,
        },
      };
    } catch (error) {
      throw new Error(`Get CV analysis by CV ID failed: ${error.message}`);
    }
  }

  async updateCVAnalysis(analysisId, updateData) {
    try {
      const analysis = await this.cvAnalysisRepository.findById(analysisId);
      if (!analysis) {
        throw new Error('CV analysis not found');
      }

      // Validate update data
      const validation = this.validationService.validateCVAnalysis(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update CV analysis
      const updatedAnalysis = await this.cvAnalysisRepository.update(
        analysisId,
        updateData
      );

      return {
        success: true,
        analysis: {
          id: updatedAnalysis._id,
          cvId: updatedAnalysis.cvId,
          analysisResult: updatedAnalysis.analysisResult,
          status: updatedAnalysis.status,
          analyzedAt: updatedAnalysis.analyzedAt,
          updatedAt: updatedAnalysis.updatedAt,
        },
        message: 'CV analysis updated successfully',
      };
    } catch (error) {
      throw new Error(`Update CV analysis failed: ${error.message}`);
    }
  }

  async deleteCVAnalysis(analysisId) {
    try {
      const analysis = await this.cvAnalysisRepository.findById(analysisId);
      if (!analysis) {
        throw new Error('CV analysis not found');
      }

      // Soft delete CV analysis
      await this.cvAnalysisRepository.softDelete(analysisId);

      return {
        success: true,
        message: 'CV analysis deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete CV analysis failed: ${error.message}`);
    }
  }

  async getAllCVAnalyses(filters = {}) {
    try {
      const { page = 1, limit = 20, status, cvId } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) query.status = status;
      if (cvId) query.cvId = cvId;

      const analyses = await this.cvAnalysisRepository.find(query, {
        skip,
        limit,
        sort: { analyzedAt: -1 },
        populate: ['cvId'],
      });

      const total = await this.cvAnalysisRepository.count(query);

      return {
        success: true,
        analyses: analyses.map(analysis => ({
          id: analysis._id,
          cvId: analysis.cvId,
          status: analysis.status,
          analyzedAt: analysis.analyzedAt,
          createdAt: analysis.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all CV analyses failed: ${error.message}`);
    }
  }

  async getCVAnalysisStats() {
    try {
      const totalAnalyses = await this.cvAnalysisRepository.count({});
      const completedAnalyses = await this.cvAnalysisRepository.count({
        status: 'completed',
      });
      const pendingAnalyses = await this.cvAnalysisRepository.count({
        status: 'pending',
      });
      const failedAnalyses = await this.cvAnalysisRepository.count({
        status: 'failed',
      });

      const analysesByStatus = await this.cvAnalysisRepository.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        stats: {
          totalAnalyses,
          completedAnalyses,
          pendingAnalyses,
          failedAnalyses,
          analysesByStatus,
        },
      };
    } catch (error) {
      throw new Error(`Get CV analysis stats failed: ${error.message}`);
    }
  }

  async getCVAnalysisTrends() {
    try {
      const trends = await this.cvAnalysisRepository.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        trends: trends.map(trend => ({
          status: trend._id,
          count: trend.count,
        })),
      };
    } catch (error) {
      throw new Error(`Get CV analysis trends failed: ${error.message}`);
    }
  }

  async getCVAnalysisRecommendations(cvId) {
    try {
      const analysis = await this.cvAnalysisRepository.findOne({ cvId });
      if (!analysis) {
        throw new Error('CV analysis not found');
      }

      // Get recommendations based on analysis result
      const recommendations = await this.geminiAIService.getCVRecommendations(
        analysis.analysisResult
      );

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      throw new Error(
        `Get CV analysis recommendations failed: ${error.message}`
      );
    }
  }

  async getCVAnalysisInsights(cvId) {
    try {
      const analysis = await this.cvAnalysisRepository.findOne({ cvId });
      if (!analysis) {
        throw new Error('CV analysis not found');
      }

      // Get insights based on analysis result
      const insights = await this.geminiAIService.getCVInsights(
        analysis.analysisResult
      );

      return {
        success: true,
        insights,
      };
    } catch (error) {
      throw new Error(`Get CV analysis insights failed: ${error.message}`);
    }
  }

  async getCVAnalysisComparison(cvIds) {
    try {
      const analyses = await this.cvAnalysisRepository.find({
        cvId: { $in: cvIds },
        status: 'completed',
      });

      if (analyses.length === 0) {
        throw new Error('No completed analyses found');
      }

      // Compare analyses
      const comparison = await this.geminiAIService.compareCVAnalyses(
        analyses.map(a => a.analysisResult)
      );

      return {
        success: true,
        comparison,
      };
    } catch (error) {
      throw new Error(`Get CV analysis comparison failed: ${error.message}`);
    }
  }

  async getCVAnalysisHistory(cvId) {
    try {
      const analyses = await this.cvAnalysisRepository.find(
        { cvId },
        { sort: { analyzedAt: -1 } }
      );

      return {
        success: true,
        history: analyses.map(analysis => ({
          id: analysis._id,
          status: analysis.status,
          analyzedAt: analysis.analyzedAt,
          createdAt: analysis.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get CV analysis history failed: ${error.message}`);
    }
  }

  async extractCVContent(cv) {
    try {
      // This would typically extract text content from the CV file
      // For now, return mock content
      return {
        fileName: cv.fileName,
        fileSize: cv.fileSize,
        content: 'Mock CV content extracted from file',
      };
    } catch (error) {
      throw new Error(`Extract CV content failed: ${error.message}`);
    }
  }
}

module.exports = CVAnalysisService;
