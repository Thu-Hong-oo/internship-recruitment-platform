const { logger } = require('../../../shared/utils/logger');

class AddEducationUseCase {
  constructor(candidateRepository) {
    this.candidateRepository = candidateRepository;
  }

  async execute({ candidateId, educationData }) {
    try {
      // Verify candidate exists
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('CANDIDATE_NOT_FOUND');
      }

      // Validate education data
      const requiredFields = ['degree', 'school', 'major'];
      for (const field of requiredFields) {
        if (!educationData[field]) {
          throw new Error(`MISSING_FIELD: ${field}`);
        }
      }

      // Prepare education entry
      const education = {
        degree: educationData.degree,
        school: educationData.school,
        major: educationData.major,
        graduationYear: educationData.graduationYear,
        gpa: educationData.gpa,
        description: educationData.description,
        startDate: educationData.startDate,
        endDate: educationData.endDate,
        isCurrentlyStudying: educationData.isCurrentlyStudying || false,
      };

      // Add education to candidate profile
      candidate.educations = candidate.educations || [];
      candidate.educations.push(education);

      // Update profile completeness
      candidate.profileCompleteness =
        this.calculateProfileCompleteness(candidate);

      // Save candidate
      const updatedCandidate = await this.candidateRepository.updateCandidate(
        candidateId,
        {
          educations: candidate.educations,
          profileCompleteness: candidate.profileCompleteness,
        }
      );

      logger.info(`Education added successfully for candidate: ${candidateId}`);

      return {
        success: true,
        message: 'Education added successfully',
        candidate: updatedCandidate,
      };
    } catch (error) {
      logger.error('Add education failed:', {
        error: error.message,
        candidateId,
        education: educationData,
      });
      throw error;
    }
  }

  calculateProfileCompleteness(candidate) {
    let completeness = 0;
    const totalSections = 6;

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

module.exports = AddEducationUseCase;
