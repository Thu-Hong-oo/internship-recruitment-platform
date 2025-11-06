const { logger } = require('../../../shared/utils/logger');

class GetCandidateProfileUseCase {
  constructor(candidateRepository, cvRepository) {
    this.candidateRepository = candidateRepository;
    this.cvRepository = cvRepository;
  }

  /**
   * Calculate profile completeness percentage
   * @param {Object} candidate - Candidate profile object
   * @returns {Object} { completeness: number, isComplete: boolean, missingFields: array }
   */
  calculateCompleteness(candidate) {
    const weights = {
      personalInfo: 20,
      professionalInfo: 20,
      education: 15,
      experience: 15,
      skills: 15,
      preferences: 10,
      resume: 5,
    };

    let totalScore = 0;
    const missingFields = [];

    // Personal Info (20%)
    const personalInfo = candidate.personalInfo || {};
    let personalScore = 0;
    if (personalInfo.fullName) personalScore += 5;
    if (personalInfo.email) personalScore += 5;
    if (personalInfo.phone) personalScore += 5;
    if (personalInfo.dateOfBirth) personalScore += 2.5;
    if (personalInfo.gender) personalScore += 2.5;

    if (personalScore < weights.personalInfo) {
      missingFields.push({
        section: 'personalInfo',
        missing: weights.personalInfo - personalScore,
      });
    }
    totalScore += personalScore;

    // Professional Info (20%)
    const professionalInfo = candidate.professionalInfo || {};
    let professionalScore = 0;
    if (professionalInfo.currentPosition) professionalScore += 5;
    if (professionalInfo.yearsOfExperience !== undefined)
      professionalScore += 5;
    if (professionalInfo.expectedSalary) professionalScore += 5;
    if (professionalInfo.bio) professionalScore += 5;

    if (professionalScore < weights.professionalInfo) {
      missingFields.push({
        section: 'professionalInfo',
        missing: weights.professionalInfo - professionalScore,
      });
    }
    totalScore += professionalScore;

    // Education (15%)
    const education = candidate.education || [];
    let educationScore = education.length > 0 ? weights.education : 0;
    if (educationScore < weights.education) {
      missingFields.push({
        section: 'education',
        missing: weights.education - educationScore,
      });
    }
    totalScore += educationScore;

    // Experience (15%)
    const experience = candidate.experience || [];
    let experienceScore = experience.length > 0 ? weights.experience : 0;
    if (experienceScore < weights.experience) {
      missingFields.push({
        section: 'experience',
        missing: weights.experience - experienceScore,
      });
    }
    totalScore += experienceScore;

    // Skills (15%)
    const skills = candidate.skills || [];
    let skillsScore = 0;
    if (skills.length >= 3) {
      skillsScore = weights.skills;
    } else if (skills.length > 0) {
      skillsScore = (skills.length / 3) * weights.skills;
    }
    if (skillsScore < weights.skills) {
      missingFields.push({
        section: 'skills',
        missing: weights.skills - skillsScore,
      });
    }
    totalScore += skillsScore;

    // Preferences (10%)
    const preferences = candidate.preferences || {};
    let preferencesScore = 0;
    if (preferences.jobTypes && preferences.jobTypes.length > 0)
      preferencesScore += 3;
    if (preferences.workLocations && preferences.workLocations.length > 0)
      preferencesScore += 3;
    if (preferences.industries && preferences.industries.length > 0)
      preferencesScore += 4;

    if (preferencesScore < weights.preferences) {
      missingFields.push({
        section: 'preferences',
        missing: weights.preferences - preferencesScore,
      });
    }
    totalScore += preferencesScore;

    // CV (5%) - Check if candidate has at least 1 CV uploaded
    const cvScore =
      candidate.cvs && candidate.cvs.length > 0 ? weights.resume : 0;
    if (cvScore < weights.resume) {
      missingFields.push({
        section: 'cv',
        missing: weights.resume - cvScore,
      });
    }
    totalScore += cvScore;

    const completeness = Math.round(totalScore);
    const isComplete = completeness >= 80; // Consider 80% as complete

    return {
      completeness,
      isComplete,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    };
  }

  async execute({ userId, candidateId }) {
    try {
      let candidate;

      if (candidateId) {
        candidate = await this.candidateRepository.findById(candidateId);
      } else if (userId) {
        candidate = await this.candidateRepository.findByUserId(userId);
      } else {
        throw new Error('MISSING_REQUIRED_PARAMETER');
      }

      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      // Get candidate's CVs
      const candidateIdToUse = candidate.profileId || candidate.id;
      const cvs = await this.cvRepository.findByCandidate(candidateIdToUse);

      logger.info('CVs retrieved:', {
        candidateId: candidateIdToUse?.toString(),
        cvsCount: cvs?.length || 0,
      });

      // Convert domain entity to plain object using domain method
      // This follows Clean Architecture - use domain entity's own serialization
      const candidateData = candidate.toPlainObject
        ? candidate.toPlainObject()
        : candidate;

      // Attach CVs to the plain object
      candidateData.cvs = cvs || [];

      logger.info('Candidate profile with CVs attached:', {
        hasCvs: !!candidateData.cvs,
        cvsCount: candidateData.cvs?.length || 0,
        userId: typeof candidateData.userId,
      });

      // Calculate completeness
      const completenessData = this.calculateCompleteness(candidateData);

      const logId = candidateId || `user:${userId}`;
      logger.info(`Candidate profile retrieved: ${logId}`);

      return {
        candidate: candidateData,
        ...completenessData,
      };
    } catch (error) {
      logger.error('Get candidate profile failed:', error);
      throw error;
    }
  }
}

module.exports = GetCandidateProfileUseCase;
