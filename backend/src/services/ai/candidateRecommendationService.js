/**
 * 👥 Candidate Recommendation Service
 * 
 * REVERSE MATCHING: Find best candidates for a job posting
 * Uses same algorithm as JobMatchingService but in reverse
 * 
 * Features:
 * - Batch scoring of all candidates
 * - Ranking by match score
 * - Tier-based filtering (A/B/C/D)
 * - Skill gap analysis
 * - Availability filtering
 */

const { getJobMatchingService } = require('./jobMatchingService');
const { logger } = require('../../utils/logger');
const CandidateProfile = require('../../models/CandidateProfile');

class CandidateRecommendationService {
  constructor() {
    this.jobMatcher = getJobMatchingService();
    this.useRAG = process.env.ENABLE_RAG_RECOMMENDATIONS === 'true'; // Feature flag
  }

  /**
   * Get recommended candidates for a job posting
   * 
   * @param {Object} job - Job posting object
   * @param {Object} options - Recommendation options
   * @returns {Promise<Object>} Ranked candidates with match scores
   */
  async getRecommendations(job, options = {}) {
    try {
      const {
        limit = 20,
        minScore = 40,
        tierFilter = ['A', 'B', 'C'], // Only return A, B, C candidates (exclude D)
        includeSkillGap = true,
        filterByAvailability = true,
        filterByLocation = false,
        useRAG = this.useRAG // Use RAG if enabled globally or explicitly requested
      } = options;

      // Use RAG-enhanced recommendations if enabled
      if (useRAG) {
        try {
          const { getRAGRecommendationService } = require('./ragRecommendationService');
          const ragService = getRAGRecommendationService();
          return await ragService.getCandidateRecommendations(job, {
            limit,
            minScore,
            tierFilter,
            includeSkillGap,
            filterByAvailability,
            filterByLocation,
            useRAG: true
          });
        } catch (ragError) {
          logger.warn('⚠️ RAG recommendation failed, falling back to weighted scoring:', ragError.message);
          // Continue with weighted scoring below
        }
      }

      logger.info(`Finding candidates for job ${job._id || job.id}`);

      // Step 1: Get all active candidates
      let candidates = await this._getAllCandidates({
        filterByAvailability,
        filterByLocation: filterByLocation ? job.location : null
      });

      logger.info(`Found ${candidates.length} active candidates`);

      // Step 2: Calculate match scores for all candidates (batch)
      const matchResults = await this.jobMatcher.batchCalculateScores(
        candidates,
        job,
        { includeExplanation: true }
      );

      // Step 3: Filter and rank
      let recommendations = matchResults
        .filter(result => 
          result.matchScore >= minScore &&
          tierFilter.includes(result.tier)
        )
        .slice(0, limit);

      // Step 4: Enrich with candidate data and skill gap analysis
      recommendations = await Promise.all(
        recommendations.map(async (rec) => {
          const candidate = candidates.find(c => 
            (c._id && c._id.toString() === rec.candidateId.toString()) ||
            (c.id && c.id.toString() === rec.candidateId.toString())
          );

          const enriched = {
            ...rec,
            candidate: {
              id: candidate._id || candidate.id,
              fullName: candidate.fullName || candidate.cv?.fullName,
              email: candidate.email,
              phone: candidate.phone || candidate.cv?.phone,
              location: candidate.location || candidate.cv?.location,
              currentPosition: candidate.cv?.experience?.[0]?.position,
              yearsExperience: this._calculateTotalYears(candidate.cv?.experience),
              education: candidate.cv?.education?.[0]?.degree,
              availability: candidate.availability || 'available',
              expectedSalary: candidate.expectedSalary,
              profileUrl: `/candidates/${candidate._id || candidate.id}`
            }
          };

          // Add skill gap analysis if requested
          if (includeSkillGap) {
            enriched.skillGap = this._analyzeSkillGap(
              rec.breakdown.skills.matched,
              rec.breakdown.skills.missing,
              job
            );
          }

          return enriched;
        })
      );

      const result = {
        jobId: job._id || job.id,
        jobTitle: job.title,
        totalCandidates: candidates.length,
        filteredCount: matchResults.filter(r => r.matchScore >= minScore).length,
        recommendations,
        summary: {
          tierA: recommendations.filter(r => r.tier === 'A').length,
          tierB: recommendations.filter(r => r.tier === 'B').length,
          tierC: recommendations.filter(r => r.tier === 'C').length,
          averageScore: recommendations.length > 0 
            ? Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length)
            : 0
        },
        timestamp: new Date()
      };

      logger.info(`Generated ${result.recommendations.length} recommendations for job ${result.jobId}`);

      return result;
    } catch (error) {
      logger.error('Candidate recommendation error:', error);
      throw error;
    }
  }

  /**
   * Get all active candidates from database
   */
  async _getAllCandidates(filters = {}) {
    const query = {};

    // Filter by availability
    if (filters.filterByAvailability) {
      query.availability = { $in: ['available', 'open_to_opportunities'] };
    }

    // Filter by location (if specified)
    if (filters.filterByLocation) {
      query.$or = [
        { location: { $regex: filters.filterByLocation, $options: 'i' } },
        { 'cv.location': { $regex: filters.filterByLocation, $options: 'i' } }
      ];
    }

    try {
      const candidates = await CandidateProfile.find(query)
        .populate('cv')
        .select('fullName email phone location cv availability expectedSalary')
        .lean();

      return candidates;
    } catch (error) {
      logger.error('Failed to fetch candidates:', error);
      return [];
    }
  }

  /**
   * Analyze skill gap between candidate and job
   */
  _analyzeSkillGap(matchedSkills, missingSkills, job) {
    const totalRequired = matchedSkills.length + missingSkills.length;
    const gapPercentage = totalRequired > 0 
      ? Math.round((missingSkills.length / totalRequired) * 100)
      : 0;

    // Categorize missing skills by priority
    const prioritySkills = this._prioritizeMissingSkills(
      missingSkills,
      job.requirements?.mustHaveSkills || []
    );

    return {
      gapPercentage,
      missingCount: missingSkills.length,
      matchedCount: matchedSkills.length,
      missingSkills: {
        critical: prioritySkills.critical, // Must-have skills
        important: prioritySkills.important, // Nice-to-have skills
        optional: prioritySkills.optional
      },
      recommendation: this._generateGapRecommendation(gapPercentage, prioritySkills)
    };
  }

  /**
   * Prioritize missing skills
   */
  _prioritizeMissingSkills(missingSkills, mustHaveSkills) {
    const critical = [];
    const important = [];
    const optional = [];

    for (const skill of missingSkills) {
      const skillName = typeof skill === 'string' ? skill : skill.name;
      
      if (mustHaveSkills.some(must => 
        must.toLowerCase() === skillName.toLowerCase()
      )) {
        critical.push(skillName);
      } else {
        // Simple heuristic: common tech skills are important
        const commonSkills = ['javascript', 'python', 'java', 'react', 'node.js', 'sql'];
        if (commonSkills.some(common => skillName.toLowerCase().includes(common))) {
          important.push(skillName);
        } else {
          optional.push(skillName);
        }
      }
    }

    return { critical, important, optional };
  }

  /**
   * Generate recommendation based on skill gap
   */
  _generateGapRecommendation(gapPercentage, prioritySkills) {
    if (gapPercentage === 0) {
      return 'Perfect match - no skill gaps';
    }

    if (prioritySkills.critical.length > 0) {
      return `Critical gaps: Missing ${prioritySkills.critical.length} must-have skill(s). Training recommended before hire.`;
    }

    if (gapPercentage <= 20) {
      return 'Minor gaps - candidate can learn quickly on the job';
    }

    if (gapPercentage <= 40) {
      return 'Moderate gaps - consider training program or mentorship';
    }

    return 'Significant gaps - extensive training needed';
  }

  /**
   * Calculate total years of experience
   */
  _calculateTotalYears(experience) {
    if (!experience || !Array.isArray(experience)) {
      return 0;
    }

    let totalYears = 0;

    for (const exp of experience) {
      if (exp.duration) {
        const years = this._parseDuration(exp.duration);
        totalYears += years;
      }
    }

    return Math.round(totalYears * 10) / 10; // Round to 1 decimal
  }

  /**
   * Parse duration string to years
   */
  _parseDuration(duration) {
    if (!duration) return 0;
    
    const lower = duration.toLowerCase();
    let years = 0;

    const yearMatch = lower.match(/(\d+\.?\d*)\s*(year|yr|năm)/);
    const monthMatch = lower.match(/(\d+)\s*(month|tháng)/);

    if (yearMatch) {
      years += parseFloat(yearMatch[1]);
    }

    if (monthMatch) {
      years += parseInt(monthMatch[1]) / 12;
    }

    return years;
  }

  /**
   * Get top N candidates for a job
   */
  async getTopCandidates(job, topN = 10, options = {}) {
    const result = await this.getRecommendations(job, {
      ...options,
      limit: topN
    });

    return result.recommendations;
  }

  /**
   * Get candidates by tier
   */
  async getCandidatesByTier(job, tier = 'A', options = {}) {
    const result = await this.getRecommendations(job, {
      ...options,
      tierFilter: [tier],
      limit: 50
    });

    return result.recommendations;
  }

  /**
   * Get candidate match details (detailed view for one candidate)
   */
  async getCandidateMatchDetails(candidateId, jobId) {
    try {
      const candidate = await CandidateProfile.findById(candidateId).populate('cv');
      const Job = require('../../models/Job');
      const job = await Job.findById(jobId);

      if (!candidate || !job) {
        throw new Error('Candidate or Job not found');
      }

      const matchResult = await this.jobMatcher.calculateMatchScore(
        candidate,
        job,
        { includeExplanation: true }
      );

      // Enrich with detailed breakdown
      return {
        ...matchResult,
        candidate: {
          id: candidate._id,
          fullName: candidate.fullName || candidate.cv?.fullName,
          email: candidate.email,
          cv: candidate.cv
        },
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          requirements: job.requirements
        },
        skillGap: this._analyzeSkillGap(
          matchResult.breakdown.skills.matched,
          matchResult.breakdown.skills.missing,
          job
        )
      };
    } catch (error) {
      logger.error('Failed to get candidate match details:', error);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

function getCandidateRecommendationService() {
  if (!instance) {
    instance = new CandidateRecommendationService();
  }
  return instance;
}

module.exports = {
  CandidateRecommendationService,
  getCandidateRecommendationService
};
