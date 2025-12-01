/**
 * Data Collection Service
 * 
 * Thu thập dữ liệu training từ:
 * - CVs đã được parse
 * - Job matches với outcomes
 * - User feedback và corrections
 */

const { logger } = require('../../utils/logger');
const TrainingData = require('../../models/TrainingData');
const CandidateProfile = require('../../models/CandidateProfile');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const Feedback = require('../../models/Feedback');

class DataCollectionService {
  constructor() {
    this.minQualityScore = 0.7; // Minimum quality score for training data
  }

  /**
   * Collect CV parsing data
   */
  async collectCVParsingData(options = {}) {
    try {
      const {
        limit = 1000,
        minQuality = this.minQualityScore,
        verifiedOnly = false
      } = options;

      logger.info('Collecting CV parsing data...', { limit, minQuality, verifiedOnly });

      // Find profiles with parsed CV data
      const query = {
        'resume.current.aiAnalysis.extractedData': { $exists: true, $ne: null }
      };

      const profiles = await CandidateProfile.find(query)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean();

      const trainingData = [];

      for (const profile of profiles) {
        const aiAnalysis = profile.resume?.current?.aiAnalysis;
        if (!aiAnalysis || !aiAnalysis.extractedData) {
          continue; // Skip if no parsed data
        }

        // Get original text (if available)
        const originalText = aiAnalysis.content?.originalText || 
                            aiAnalysis.content?.processedText || 
                            '';

        if (!originalText || originalText.length < 50) {
          continue; // Skip if no text
        }

        // Get parsed result (ground truth)
        const extractedData = aiAnalysis.extractedData;
        const parsedResult = {
          personalInfo: extractedData.personalInfo || {},
          skills: extractedData.skills || profile.skills?.technical || [],
          experience: extractedData.experience || profile.experience || [],
          education: extractedData.education || profile.education || {}
        };

        // Calculate quality score
        const quality = this._calculateQualityScore(parsedResult);

        if (quality < minQuality) {
          continue; // Skip low quality data
        }

        // Get user corrections (if any)
        const corrections = await Feedback.find({
          type: 'cv_parsing',
          userId: profile.userId,
          isSignificant: true
        }).lean();

        // If there are corrections, use corrected version
        let finalOutput = parsedResult;
        if (corrections.length > 0) {
          // Use the most recent correction
          const latestCorrection = corrections.sort((a, b) => 
            new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
          )[0];
          finalOutput = latestCorrection.userCorrection || parsedResult;
        }

        trainingData.push({
          type: 'cv_parsing',
          input: originalText,
          output: finalOutput,
          metadata: {
            source: corrections.length > 0 ? 'user_feedback' : 'api_response',
            timestamp: profile.updatedAt || profile.createdAt,
            quality: quality,
            verified: verifiedOnly ? true : false,
            userId: profile.userId
          }
        });
      }

      logger.info(`Collected ${trainingData.length} CV parsing training samples`);
      return trainingData;
    } catch (error) {
      logger.error('Error collecting CV parsing data:', error);
      throw error;
    }
  }

  /**
   * Collect job matching data
   */
  async collectJobMatchingData(options = {}) {
    try {
      const {
        limit = 1000,
        includeOutcomes = true
      } = options;

      logger.info('Collecting job matching data...', { limit, includeOutcomes });

      // Find applications with outcomes
      const applications = await Application.find({
        status: { $in: ['hired', 'rejected', 'interviewed', 'shortlisted'] }
      })
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('candidateId', 'userId')
        .populate('jobId', 'title description requirements requiredSkills')
        .lean();

      const trainingData = [];

      for (const app of applications) {
        if (!app.candidateId || !app.jobId) {
          continue; // Skip if missing data
        }

        // Get candidate profile for CV data
        const candidateProfile = await CandidateProfile.findOne({
          userId: app.candidateId.userId || app.candidateId
        }).lean();

        if (!candidateProfile) {
          continue; // Skip if no profile
        }

        const jobData = app.jobId;
        const matchScore = app.matchingScore?.overall || app.matchScore || 0;
        const outcome = app.status;

        // Extract CV data from profile
        const extractedData = candidateProfile.resume?.current?.aiAnalysis?.extractedData || {};
        const cvSkills = extractedData.skills || candidateProfile.skills?.technical || [];
        const cvExperience = extractedData.experience || candidateProfile.experience || [];
        const cvEducation = extractedData.education || candidateProfile.education || {};

        // Create input pair
        const input = {
          cv: {
            skills: cvSkills,
            experience: cvExperience,
            education: cvEducation
          },
          job: {
            title: jobData.title || '',
            description: jobData.description || '',
            requirements: jobData.requirements || [],
            skills: jobData.requiredSkills || []
          }
        };

        // Create output (actual outcome)
        const output = {
          predictedScore: matchScore,
          actualOutcome: outcome,
          outcomeMapping: {
            'hired': 1.0,
            'shortlisted': 0.8,
            'interviewed': 0.6,
            'rejected': 0.2
          }[outcome] || 0.5
        };

        trainingData.push({
          type: 'job_matching',
          input: input,
          output: output,
          metadata: {
            source: 'system_generated',
            timestamp: app.createdAt,
            quality: 1.0, // High quality (real outcomes)
            verified: true,
            userId: candidateProfile.userId,
            jobId: jobData._id
          }
        });
      }

      logger.info(`Collected ${trainingData.length} job matching training samples`);
      return trainingData;
    } catch (error) {
      logger.error('Error collecting job matching data:', error);
      throw error;
    }
  }

  /**
   * Collect feedback data
   */
  async collectFeedbackData(options = {}) {
    try {
      const {
        type = null,
        significantOnly = true,
        limit = 1000
      } = options;

      logger.info('Collecting feedback data...', { type, significantOnly, limit });

      const query = {
        isSignificant: significantOnly,
        addedToTraining: false // Only get new feedback
      };

      if (type) {
        query.type = type;
      }

      const feedbacks = await Feedback.find(query)
        .limit(limit)
        .sort({ timestamp: -1 })
        .lean();

      const trainingData = [];

      for (const feedback of feedbacks) {
        trainingData.push({
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
      }

      logger.info(`Collected ${trainingData.length} feedback training samples`);
      return trainingData;
    } catch (error) {
      logger.error('Error collecting feedback data:', error);
      throw error;
    }
  }

  /**
   * Save training data to database
   */
  async saveTrainingData(trainingDataArray) {
    try {
      const saved = await TrainingData.insertMany(trainingDataArray, {
        ordered: false // Continue on error
      });

      logger.info(`Saved ${saved.length} training data samples`);
      return saved;
    } catch (error) {
      logger.error('Error saving training data:', error);
      throw error;
    }
  }

  /**
   * Calculate quality score for parsed CV data
   */
  _calculateQualityScore(parsedResult) {
    let score = 0;
    let factors = 0;

    // Check personal info completeness
    if (parsedResult.personalInfo) {
      const pi = parsedResult.personalInfo;
      const piScore = (pi.fullName ? 0.2 : 0) +
                     (pi.email ? 0.2 : 0) +
                     (pi.phone ? 0.1 : 0);
      score += piScore;
      factors += 0.5;
    }

    // Check skills
    if (parsedResult.skills && Array.isArray(parsedResult.skills) && parsedResult.skills.length > 0) {
      score += 0.2;
      factors += 0.2;
    }

    // Check experience
    if (parsedResult.experience && Array.isArray(parsedResult.experience) && parsedResult.experience.length > 0) {
      score += 0.2;
      factors += 0.2;
    }

    // Check education
    if (parsedResult.education && parsedResult.education.institution) {
      score += 0.1;
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }
}

module.exports = new DataCollectionService();

