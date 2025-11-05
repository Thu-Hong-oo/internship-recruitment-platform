// src/domain/recruitment/value-objects/JobRequirement.js

class JobRequirement {
  constructor(requiredSkills = [], certifications = [], languages = []) {
    this.requiredSkills = requiredSkills;
    this.certifications = certifications;
    this.languages = languages;
  }

  hasSkill(skill) {
    return this.requiredSkills.includes(skill);
  }

  requiresCertification(cert) {
    return this.certifications.includes(cert);
  }
}

module.exports = JobRequirement;
