/**
 * CandidateProfile Domain Entity
 *
 * Represents a candidate's professional profile in the recruitment system.
 * Contains personal information, professional details, education, experience,
 * and job preferences.
 *
 * Following Clean Architecture principles:
 * - No dependencies on infrastructure layer
 * - Business logic encapsulated within entity
 * - Constructor accepts only required fields
 * - Optional fields set to null (not undefined)
 * - No default values in constructor
 */
class CandidateProfile {
  constructor(
    profileId,
    userId,
    personalInfo = null,
    professionalInfo = null,
    education = null,
    experience = null,
    skills = null,
    preferences = null,
    profileCompleteness = 0,
    visibility = 'public',
    createdAt = null,
    updatedAt = null
  ) {
    // Required fields
    this.profileId = profileId;
    this.userId = userId;

    // Optional nested objects
    this.personalInfo = personalInfo; // { fullName, dateOfBirth, gender, phone, avatarUrl, address }
    this.professionalInfo = professionalInfo; // { headline, bio, portfolioUrl, linkedInUrl, githubUrl }

    // Optional arrays
    this.education = education; // [{ institution, degree, fieldOfStudy, startDate, endDate, grade }]
    this.experience = experience; // [{ company, position, startDate, endDate, description, isCurrent }]
    this.skills = skills; // [{ name, level }]

    // Optional preferences
    this.preferences = preferences; // { jobTypes, locations, salaryRange }

    // Profile metadata
    this.profileCompleteness = profileCompleteness;
    this.visibility = visibility;

    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validates the candidate profile
   * @throws {Error} if validation fails
   */
  validate() {
    if (!this.userId) {
      throw new Error('User ID is required for candidate profile');
    }

    if (this.profileCompleteness < 0 || this.profileCompleteness > 100) {
      throw new Error('Profile completeness must be between 0 and 100');
    }

    const validVisibilities = ['public', 'private', 'restricted'];
    if (!validVisibilities.includes(this.visibility)) {
      throw new Error(
        `Visibility must be one of: ${validVisibilities.join(', ')}`
      );
    }
  }

  /**
   * Updates personal information
   * @param {Object} newPersonalInfo - New personal information
   */
  updatePersonalInfo(newPersonalInfo) {
    this.personalInfo = {
      ...this.personalInfo,
      ...newPersonalInfo,
    };
    this.updatedAt = new Date();
  }

  /**
   * Updates professional information
   * @param {Object} newProfessionalInfo - New professional information
   */
  updateProfessionalInfo(newProfessionalInfo) {
    this.professionalInfo = {
      ...this.professionalInfo,
      ...newProfessionalInfo,
    };
    this.updatedAt = new Date();
  }

  /**
   * Adds education entry
   * @param {Object} educationEntry - Education entry to add
   */
  addEducation(educationEntry) {
    if (!this.education) {
      this.education = [];
    }
    this.education.push(educationEntry);
    this.updatedAt = new Date();
  }

  /**
   * Removes education entry by index
   * @param {number} index - Index of education entry to remove
   */
  removeEducation(index) {
    if (this.education && index >= 0 && index < this.education.length) {
      this.education.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * Adds work experience entry
   * @param {Object} experienceEntry - Experience entry to add
   */
  addExperience(experienceEntry) {
    if (!this.experience) {
      this.experience = [];
    }
    this.experience.push(experienceEntry);
    this.updatedAt = new Date();
  }

  /**
   * Removes work experience entry by index
   * @param {number} index - Index of experience entry to remove
   */
  removeExperience(index) {
    if (this.experience && index >= 0 && index < this.experience.length) {
      this.experience.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * Adds a skill
   * @param {Object} skill - Skill to add { name, level }
   */
  addSkill(skill) {
    if (!this.skills) {
      this.skills = [];
    }

    // Check if skill already exists
    const existingSkill = this.skills.find(s => s.name === skill.name);
    if (existingSkill) {
      existingSkill.level = skill.level; // Update level
    } else {
      this.skills.push(skill);
    }

    this.updatedAt = new Date();
  }

  /**
   * Removes a skill by name
   * @param {string} skillName - Name of skill to remove
   */
  removeSkill(skillName) {
    if (this.skills) {
      this.skills = this.skills.filter(s => s.name !== skillName);
      this.updatedAt = new Date();
    }
  }

  /**
   * Updates job preferences
   * @param {Object} newPreferences - New preferences
   */
  updatePreferences(newPreferences) {
    this.preferences = {
      ...this.preferences,
      ...newPreferences,
    };
    this.updatedAt = new Date();
  }

  /**
   * Calculates profile completeness percentage
   * @returns {number} Completeness percentage (0-100)
   */
  calculateCompleteness() {
    let score = 0;
    const weights = {
      personalInfo: 20,
      professionalInfo: 15,
      education: 15,
      experience: 25,
      skills: 15,
      preferences: 10,
    };

    // Personal info (20%)
    if (this.personalInfo) {
      let personalScore = 0;
      const personalFields = [
        'fullName',
        'dateOfBirth',
        'gender',
        'phone',
        'avatarUrl',
      ];
      const filledFields = personalFields.filter(
        field => this.personalInfo[field]
      ).length;
      personalScore =
        (filledFields / personalFields.length) * weights.personalInfo;
      score += personalScore;
    }

    // Professional info (15%)
    if (this.professionalInfo) {
      let professionalScore = 0;
      const professionalFields = [
        'headline',
        'bio',
        'portfolioUrl',
        'linkedInUrl',
        'githubUrl',
      ];
      const filledFields = professionalFields.filter(
        field => this.professionalInfo[field]
      ).length;
      professionalScore =
        (filledFields / professionalFields.length) * weights.professionalInfo;
      score += professionalScore;
    }

    // Education (15%)
    if (this.education && this.education.length > 0) {
      score += weights.education;
    }

    // Experience (25%)
    if (this.experience && this.experience.length > 0) {
      score += weights.experience;
    }

    // Skills (15%)
    if (this.skills && this.skills.length > 0) {
      score += weights.skills;
    }

    // Preferences (10%)
    if (
      this.preferences &&
      this.preferences.jobTypes &&
      this.preferences.jobTypes.length > 0
    ) {
      score += weights.preferences;
    }

    this.profileCompleteness = Math.round(score);
    return this.profileCompleteness;
  }

  /**
   * Checks if profile is complete (>= 80%)
   * @returns {boolean} True if profile is complete
   */
  isProfileComplete() {
    return this.profileCompleteness >= 80;
  }

  /**
   * Sets profile visibility
   * @param {string} visibility - Visibility setting ('public', 'private', 'restricted')
   */
  setVisibility(visibility) {
    const validVisibilities = ['public', 'private', 'restricted'];
    if (!validVisibilities.includes(visibility)) {
      throw new Error(`Invalid visibility: ${visibility}`);
    }
    this.visibility = visibility;
    this.updatedAt = new Date();
  }

  /**
   * Checks if profile is public
   * @returns {boolean} True if profile is public
   */
  isPublic() {
    return this.visibility === 'public';
  }

  /**
   * Checks if profile is private
   * @returns {boolean} True if profile is private
   */
  isPrivate() {
    return this.visibility === 'private';
  }

  /**
   * Gets years of experience
   * @returns {number} Total years of experience
   */
  getYearsOfExperience() {
    if (!this.experience || this.experience.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    this.experience.forEach(exp => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.isCurrent ? new Date() : new Date(exp.endDate);
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      totalMonths += months;
    });

    return Math.round(totalMonths / 12);
  }

  /**
   * Gets current company (if any)
   * @returns {string|null} Current company name or null
   */
  getCurrentCompany() {
    if (!this.experience || this.experience.length === 0) {
      return null;
    }

    const currentExp = this.experience.find(exp => exp.isCurrent);
    return currentExp ? currentExp.company : null;
  }

  /**
   * Gets current position (if any)
   * @returns {string|null} Current position or null
   */
  getCurrentPosition() {
    if (!this.experience || this.experience.length === 0) {
      return null;
    }

    const currentExp = this.experience.find(exp => exp.isCurrent);
    return currentExp ? currentExp.position : null;
  }

  /**
   * Gets all skill names
   * @returns {string[]} Array of skill names
   */
  getSkillNames() {
    if (!this.skills || this.skills.length === 0) {
      return [];
    }
    return this.skills.map(skill => skill.name);
  }

  /**
   * Checks if candidate has a specific skill
   * @param {string} skillName - Skill name to check
   * @returns {boolean} True if candidate has the skill
   */
  hasSkill(skillName) {
    if (!this.skills) return false;
    return this.skills.some(skill => skill.name === skillName);
  }

  /**
   * Gets skill level
   * @param {string} skillName - Skill name
   * @returns {string|null} Skill level or null if not found
   */
  getSkillLevel(skillName) {
    if (!this.skills) return null;
    const skill = this.skills.find(s => s.name === skillName);
    return skill ? skill.level : null;
  }
}

module.exports = CandidateProfile;
