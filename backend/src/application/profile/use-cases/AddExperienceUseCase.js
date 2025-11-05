const { logger } = require('../../../shared/utils/logger');

class AddExperienceUseCase {
  constructor(candidateRepository) {
    this.candidateRepository = candidateRepository;
  }

  async execute({ candidateId, experienceData }) {
    try {
      // Verify candidate exists
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      // Validate experience data
      const requiredFields = ['position', 'company'];
      for (const field of requiredFields) {
        if (!experienceData[field]) {
          throw new Error(`MISSING_FIELD: ${field}`);
        }
      }

      // Prepare experience entry
      const experience = {
        position: experienceData.position,
        company: experienceData.company,
        location: experienceData.location,
        startDate: experienceData.startDate,
        endDate: experienceData.endDate,
        isCurrentJob: experienceData.isCurrentJob || false,
        description: experienceData.description,
        achievements: experienceData.achievements || [],
        skills: experienceData.skills || [],
      };

      // Add experience to candidate profile
      candidate.experiences = candidate.experiences || [];
      candidate.experiences.push(experience);

      // Update profile completeness
      candidate.profileCompleteness =
        this.calculateProfileCompleteness(candidate);

      // Save candidate
      const updatedCandidate = await this.candidateRepository.updateCandidate(
        candidateId,
        {
          experiences: candidate.experiences,
          profileCompleteness: candidate.profileCompleteness,
        }
      );

      logger.info(
        `Experience added successfully for candidate: ${candidateId}`
      );

      return {
        success: true,
        message: 'Experience added successfully',
        candidate: updatedCandidate,
      };
    } catch (error) {
      logger.error('Add experience failed:', {
        error: error.message,
        candidateId,
        experience: experienceData,
      });
      throw error;
    }
  }

  calculateProfileCompleteness(candidate) {
    let completeness = 0;

    // Basic info (25%)
    if (candidate.personalInfo && candidate.personalInfo.fullName)
      completeness += 25;

    // Contact info (15%)
    if (candidate.personalInfo && candidate.personalInfo.email)
      completeness += 15;

    // Skills (20%)
    if (candidate.skills && candidate.skills.length > 0) completeness += 20;

    // Education (20%)
    if (candidate.educations && candidate.educations.length > 0)
      completeness += 20;

    // Experience (15%)
    if (candidate.experiences && candidate.experiences.length > 0)
      completeness += 15;

    // Bio/Summary (5%)
    if (candidate.bio && candidate.bio.trim().length > 0) completeness += 5;

    return Math.min(completeness, 100);
  }
}

module.exports = AddExperienceUseCase;
