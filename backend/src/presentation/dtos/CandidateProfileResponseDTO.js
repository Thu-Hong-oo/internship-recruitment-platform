/**
 * Candidate Profile Response DTO
 * Presentation Layer - Data Transfer Object for Candidate Profile API responses
 * Transforms infrastructure CandidateProfile model into API-friendly format
 */

class CandidateProfileResponseDTO {
  constructor(candidateProfileModel) {
    this.id = candidateProfileModel._id;
    this.userId = candidateProfileModel.userId;
    this.personalInfo = candidateProfileModel.personalInfo || {};
    this.professionalInfo = candidateProfileModel.professionalInfo || {};
    this.education = candidateProfileModel.education || [];
    this.experience = candidateProfileModel.experience || [];
    this.skills = candidateProfileModel.skills || [];
    this.languages = candidateProfileModel.languages || [];
    this.certifications = candidateProfileModel.certifications || [];
    this.projects = candidateProfileModel.projects || [];
    this.achievements = candidateProfileModel.achievements || [];
    this.preferences = candidateProfileModel.preferences || {};
    this.socialLinks = candidateProfileModel.socialLinks || {};
    this.resume = candidateProfileModel.resume || null;
    this.portfolio = candidateProfileModel.portfolio || null;
    this.profileCompleteness = candidateProfileModel.profileCompleteness || 0;
    this.isOpenToWork =
      candidateProfileModel.isOpenToWork !== undefined
        ? candidateProfileModel.isOpenToWork
        : true;
    this.lastUpdated =
      candidateProfileModel.lastUpdated || candidateProfileModel.updatedAt;
    this.createdAt = candidateProfileModel.createdAt;
    this.updatedAt = candidateProfileModel.updatedAt;
  }

  /**
   * Create DTO array from CandidateProfile models array
   * @param {Array} candidateProfileModels - Array of CandidateProfile model instances
   * @returns {Array<CandidateProfileResponseDTO>}
   */
  static fromCandidateProfiles(candidateProfileModels) {
    return candidateProfileModels.map(
      model => new CandidateProfileResponseDTO(model)
    );
  }

  /**
   * Convert to plain object for JSON response
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      personalInfo: this.personalInfo,
      professionalInfo: this.professionalInfo,
      education: this.education,
      experience: this.experience,
      skills: this.skills,
      languages: this.languages,
      certifications: this.certifications,
      projects: this.projects,
      achievements: this.achievements,
      preferences: this.preferences,
      socialLinks: this.socialLinks,
      resume: this.resume,
      portfolio: this.portfolio,
      profileCompleteness: this.profileCompleteness,
      isOpenToWork: this.isOpenToWork,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = CandidateProfileResponseDTO;
