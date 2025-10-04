const mongoose = require('mongoose');
const { AppError } = require('../../../utils/errors');

class ProfileHelpers {
  /**
   * Calculate profile completion percentage
   */
  static calculateProfileCompletion(profile) {
    let completed = 0;
    const totalFields = 10;

    // Check required fields
    if (profile.personalInfo?.fullName) completed++;
    if (profile.personalInfo?.phone) completed++;
    if (profile.personalInfo?.address?.city) completed++;
    if (profile.education?.university?.name) completed++;
    if (profile.skills?.technical?.length > 0) completed++;
    if (
      profile.experience?.internships?.length > 0 ||
      profile.experience?.projects?.length > 0
    )
      completed++;
    if (profile.preferences?.locations?.length > 0) completed++;
    if (profile.preferences?.industries?.length > 0) completed++;
    if (profile.resume?.current?.url) completed++;
    if (profile.personalInfo?.bio) completed++;

    return Math.round((completed / totalFields) * 100);
  }

  /**
   * Get section data from profile
   */
  static getSectionData(profile, section) {
    switch (section) {
      case 'education':
        return profile.education;
      case 'experience':
        return profile.experience;
      case 'skills':
        return profile.skills;
      case 'projects':
        return profile.experience?.projects || [];
      case 'certifications':
        return profile.education?.certifications || [];
      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Add entry to section
   */
  static addSectionEntry(profile, section, data) {
    const newId = new mongoose.Types.ObjectId();
    const newEntry = { _id: newId, ...data };

    switch (section) {
      case 'education':
        if (data.type === 'university') {
          // Check if university education already exists
          if (
            profile.education.university &&
            profile.education.university.institution
          ) {
            throw new AppError(
              'University education already exists. Use update instead.',
              400
            );
          }
          profile.education.university = newEntry;
          return profile.education.university;
        } else {
          // Add to certifications
          if (!profile.education.certifications)
            profile.education.certifications = [];
          profile.education.certifications.push(newEntry);
          return newEntry;
        }

      case 'experience':
        if (data.type === 'internship') {
          if (!profile.experience.internships)
            profile.experience.internships = [];
          profile.experience.internships.push(newEntry);
        } else {
          if (!profile.experience.projects) profile.experience.projects = [];
          profile.experience.projects.push(newEntry);
        }
        return newEntry;

      case 'skills':
        const skillType = data.type || 'technical';
        if (!profile.skills[skillType]) profile.skills[skillType] = [];
        profile.skills[skillType].push(newEntry);
        return newEntry;

      case 'projects':
        if (!profile.experience.projects) profile.experience.projects = [];
        profile.experience.projects.push(newEntry);
        return newEntry;

      case 'certifications':
        if (!profile.education.certifications)
          profile.education.certifications = [];
        profile.education.certifications.push(newEntry);
        return newEntry;

      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Update entry in section
   */
  static updateSectionEntry(profile, section, id, data) {
    switch (section) {
      case 'education':
        // Check if it's university education
        if (
          profile.education.university &&
          profile.education.university._id &&
          profile.education.university._id.toString() === id
        ) {
          profile.education.university = {
            ...profile.education.university.toObject(),
            ...data,
          };
          return profile.education.university;
        } else {
          // Find in certifications
          const certIndex = profile.education.certifications?.findIndex(
            cert => cert._id.toString() === id
          );
          if (certIndex === -1)
            throw new AppError('Education entry not found', 404);

          profile.education.certifications[certIndex] = {
            ...profile.education.certifications[certIndex].toObject(),
            ...data,
          };
          return profile.education.certifications[certIndex];
        }

      case 'experience':
        // Check internships
        let internIndex = profile.experience.internships?.findIndex(
          item => item._id.toString() === id
        );
        if (internIndex !== -1) {
          profile.experience.internships[internIndex] = {
            ...profile.experience.internships[internIndex].toObject(),
            ...data,
          };
          return profile.experience.internships[internIndex];
        }

        // Check projects
        let projectIndex = profile.experience.projects?.findIndex(
          item => item._id.toString() === id
        );
        if (projectIndex !== -1) {
          profile.experience.projects[projectIndex] = {
            ...profile.experience.projects[projectIndex].toObject(),
            ...data,
          };
          return profile.experience.projects[projectIndex];
        }

        throw new AppError('Experience entry not found', 404);

      case 'skills':
        // Check all skill types
        for (const skillType of ['technical', 'soft', 'languages']) {
          const skillIndex = profile.skills[skillType]?.findIndex(
            skill => skill._id.toString() === id
          );
          if (skillIndex !== -1) {
            profile.skills[skillType][skillIndex] = {
              ...profile.skills[skillType][skillIndex].toObject(),
              ...data,
            };
            return profile.skills[skillType][skillIndex];
          }
        }
        throw new AppError('Skill not found', 404);

      case 'projects':
        projectIndex = profile.experience.projects?.findIndex(
          project => project._id.toString() === id
        );
        if (projectIndex === -1) throw new AppError('Project not found', 404);

        profile.experience.projects[projectIndex] = {
          ...profile.experience.projects[projectIndex].toObject(),
          ...data,
        };
        return profile.experience.projects[projectIndex];

      case 'certifications':
        const certIndex = profile.education.certifications?.findIndex(
          cert => cert._id.toString() === id
        );
        if (certIndex === -1)
          throw new AppError('Certification not found', 404);

        profile.education.certifications[certIndex] = {
          ...profile.education.certifications[certIndex].toObject(),
          ...data,
        };
        return profile.education.certifications[certIndex];

      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Delete entry from section
   */
  static deleteSectionEntry(profile, section, id) {
    switch (section) {
      case 'education':
        // Check if it's university education
        if (
          profile.education.university &&
          profile.education.university._id &&
          profile.education.university._id.toString() === id
        ) {
          profile.education.university = {};
          return;
        } else {
          // Find in certifications
          const certIndex = profile.education.certifications?.findIndex(
            cert => cert._id.toString() === id
          );
          if (certIndex === -1)
            throw new AppError('Education entry not found', 404);

          profile.education.certifications.splice(certIndex, 1);
          return;
        }

      case 'experience':
        // Check internships
        let internIndex = profile.experience.internships?.findIndex(
          item => item._id.toString() === id
        );
        if (internIndex !== -1) {
          profile.experience.internships.splice(internIndex, 1);
          return;
        }

        // Check projects
        let projectIndex = profile.experience.projects?.findIndex(
          item => item._id.toString() === id
        );
        if (projectIndex !== -1) {
          profile.experience.projects.splice(projectIndex, 1);
          return;
        }

        throw new AppError('Experience entry not found', 404);

      case 'skills':
        // Check all skill types
        for (const skillType of ['technical', 'soft', 'languages']) {
          const skillIndex = profile.skills[skillType]?.findIndex(
            skill => skill._id.toString() === id
          );
          if (skillIndex !== -1) {
            profile.skills[skillType].splice(skillIndex, 1);
            return;
          }
        }
        throw new AppError('Skill not found', 404);

      case 'projects':
        projectIndex = profile.experience.projects?.findIndex(
          project => project._id.toString() === id
        );
        if (projectIndex === -1) throw new AppError('Project not found', 404);

        profile.experience.projects.splice(projectIndex, 1);
        return;

      case 'certifications':
        const certIndex = profile.education.certifications?.findIndex(
          cert => cert._id.toString() === id
        );
        if (certIndex === -1)
          throw new AppError('Certification not found', 404);

        profile.education.certifications.splice(certIndex, 1);
        return;

      default:
        throw new AppError('Invalid section', 400);
    }
  }

  /**
   * Update profile section (profile, visibility, preferences)
   */
  static updateProfileSection(profile, section, data) {
    switch (section) {
      case 'profile':
        return this._updateProfileSection(profile, data);
      case 'visibility':
        return this._updateVisibilitySection(profile, data);
      case 'preferences':
        return this._updatePreferencesSection(profile, data);
      default:
        throw new AppError('Invalid profile section', 400);
    }
  }

  /**
   * Update profile section helper
   */
  static _updateProfileSection(profile, data) {
    const { personalInfo, bio, availability } = data;

    if (personalInfo) {
      // Deep merge personalInfo to preserve existing nested fields
      if (!profile.personalInfo) profile.personalInfo = {};

      // Update fields one by one to preserve existing nested structures
      Object.keys(personalInfo).forEach(key => {
        if (key === 'address' && personalInfo[key]) {
          // Merge address object specifically
          profile.personalInfo.address = {
            ...profile.personalInfo.address,
            ...personalInfo[key],
          };
        } else if (personalInfo[key] !== undefined) {
          // Update other fields directly
          profile.personalInfo[key] = personalInfo[key];
        }
      });
    }

    if (bio !== undefined) {
      if (!profile.personalInfo) profile.personalInfo = {};
      profile.personalInfo.bio = bio;
    }

    if (availability !== undefined) {
      profile.availability = availability;
    }
  }

  /**
   * Update visibility section helper
   */
  static _updateVisibilitySection(profile, data) {
    const { visibility, searchable } = data;

    if (!profile.settings) profile.settings = {};

    if (visibility) {
      profile.settings.visibility = visibility;
      profile.settings.lastVisibilityChange = new Date();
    }

    if (searchable !== undefined) {
      profile.settings.searchable = searchable;
    }
  }

  /**
   * Update preferences section helper
   */
  static _updatePreferencesSection(profile, data) {
    if (!profile.preferences) profile.preferences = {};
    profile.preferences = { ...profile.preferences, ...data };
  }

  /**
   * Filter profile data based on includes
   */
  static filterProfileData(profile, includes) {
    const data = {
      _id: profile._id,
      userId: profile.userId,
      personalInfo: profile.personalInfo,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    if (includes.includes('education')) {
      data.education = profile.education;
    }

    if (includes.includes('experience')) {
      data.experience = profile.experience;
    }

    if (includes.includes('skills')) {
      data.skills = profile.skills;
    }

    if (includes.includes('projects')) {
      data.projects = profile.experience?.projects || [];
    }

    if (includes.includes('certifications')) {
      data.certifications = profile.education?.certifications || [];
    }

    if (includes.includes('resume')) {
      data.resume = profile.resume;
    }

    // Always include progress and analytics for dashboard
    data.progress = profile.progress;
    data.analytics = profile.analytics;

    return data;
  }
}

module.exports = ProfileHelpers;
