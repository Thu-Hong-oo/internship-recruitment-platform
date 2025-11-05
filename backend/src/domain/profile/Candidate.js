// src/domain/profile/Candidate.js
const { User } = require('../identity');
const JobSeekingStatus = require('./JobSeekingStatus');
const { Address } = require('../recruitment');
const { Skill } = require('../master-data');
const Education = require('./value-objects/Education');

class Candidate extends User {
  constructor(
    userId,
    email,
    fullName,
    avatarUrl = null,
    password,
    role,
    status,
    lastLogin = null,
    oauthCredentials = [],
    headline = '',
    bio = '',
    skills = [],
    educations = [],
    address = null,
    portfolioUrl = '',
    profileCompleteness = 0,
    jobSeekingStatus = JobSeekingStatus.INACTIVE
  ) {
    super(
      userId,
      email,
      fullName,
      avatarUrl,
      password,
      role,
      status,
      lastLogin,
      oauthCredentials
    );
    this.headline = headline;
    this.bio = bio;
    this.skills = skills;
    this.educations = educations;
    this.address = address;
    this.portfolioUrl = portfolioUrl;
    this.profileCompleteness = profileCompleteness;
    this.jobSeekingStatus = jobSeekingStatus;
  }

  updateProfile(headline, bio) {
    if (headline) this.headline = headline;
    if (bio) this.bio = bio;
    this.calculateProfileCompleteness();
  }

  addSkill(skill) {
    if (!(skill instanceof Skill)) {
      throw new Error('Skill must be a Skill instance');
    }
    if (!this.skills.find(s => s.skillId === skill.skillId)) {
      this.skills.push(skill);
    }
  }

  removeSkill(skillId) {
    this.skills = this.skills.filter(skill => skill.skillId !== skillId);
  }

  updateExperience(years) {
    if (years < 0) {
      throw new Error('Experience years cannot be negative');
    }
    this.experienceYears = years;
    this.calculateProfileCompleteness();
  }

  addEducation(education) {
    if (!(education instanceof Education)) {
      throw new Error('Education must be an Education instance');
    }
    this.educations.push(education);
    this.calculateProfileCompleteness();
  }

  removeEducation(educationId) {
    this.educations = this.educations.filter(edu => edu.id !== educationId);
    this.calculateProfileCompleteness();
  }

  updateAddress(address) {
    if (!(address instanceof Address)) {
      throw new Error('Address must be an Address instance');
    }
    this.address = address;
  }

  calculateProfileCompleteness() {
    let completeness = 0;
    const fields = [this.headline, this.bio];

    fields.forEach(field => {
      if (field && field.trim().length > 0) completeness += 20;
    });

    if (this.skills.length > 0) completeness += 20;
    if (this.educations.length > 0) completeness += 20;
    if (this.address) completeness += 20;
    if (this.portfolioUrl) completeness += 20;

    this.profileCompleteness = Math.min(completeness, 100);
    return this.profileCompleteness;
  }

  activateJobSeeking() {
    this.jobSeekingStatus = JobSeekingStatus.ACTIVE;
  }

  deactivateJobSeeking() {
    this.jobSeekingStatus = JobSeekingStatus.INACTIVE;
  }
}

module.exports = Candidate;
