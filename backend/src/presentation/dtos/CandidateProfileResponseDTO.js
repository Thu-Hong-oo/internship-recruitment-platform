/**
 * Candidate Profile Response DTO
 * Presentation Layer - Data Transfer Object for Candidate Profile API responses
 * Transforms infrastructure CandidateProfile model into API-friendly format
 */

class CandidateProfileResponseDTO {
  constructor(candidateProfileModel) {
    // Extract ID - handle both _id and id
    const rawId = candidateProfileModel._id || candidateProfileModel.id;
    this.id = rawId?.toString ? rawId.toString() : rawId;

    // Handle userId - PROFESSIONAL approach for all cases
    const userIdValue = candidateProfileModel.userId;

    if (!userIdValue) {
      this.userId = null;
    } else if (typeof userIdValue === 'string') {
      // Case 1: Already a string (best case)
      this.userId = userIdValue;
    } else if (userIdValue._id) {
      // Case 2: Populated User object with _id
      this.userId = userIdValue._id.toString
        ? userIdValue._id.toString()
        : userIdValue._id;
    } else if (
      userIdValue.toString &&
      typeof userIdValue.toString === 'function'
    ) {
      // Case 3: Mongoose ObjectId with toString method
      this.userId = userIdValue.toString();
    } else {
      // Case 4: Fallback - convert to string
      this.userId = String(userIdValue);
    }

    this.personalInfo = candidateProfileModel.personalInfo || {};

    // Get avatar from User model (populated userId)
    this.avatarUrl = null;
    if (
      candidateProfileModel.userId &&
      typeof candidateProfileModel.userId === 'object'
    ) {
      // userId is populated User object - priority order:
      // 1. avatarUrl (newly uploaded)
      // 2. avatar (legacy field)
      // 3. Google profile picture (from OAuth)
      this.avatarUrl =
        candidateProfileModel.userId.avatarUrl ||
        candidateProfileModel.userId.avatar ||
        candidateProfileModel.userId.googleProfile?.profilePicture ||
        null;
    }
    // Fallback: check if avatar exists in personalInfo
    if (!this.avatarUrl && this.personalInfo.avatarUrl) {
      this.avatarUrl = this.personalInfo.avatarUrl;
    }
    // If still no avatar, set explicit null (better than undefined for API)
    if (!this.avatarUrl) {
      this.avatarUrl = null;
    }

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
    // CVs are managed separately - use GET /api/candidates/cv
    this.cvs = candidateProfileModel.cvs || [];
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
      avatarUrl: this.avatarUrl, // Include avatar URL in response
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
      cvs: this.cvs, // Array of CV objects from CV collection
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
