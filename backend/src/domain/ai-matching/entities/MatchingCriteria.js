/**
 * MatchingCriteria Entity
 * Domain: AI-Matching
 * Represents the criteria used for matching candidates to jobs
 */
class MatchingCriteria {
  constructor(props) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description || '';
    this.skillWeights = props.skillWeights || {};
    this.experienceWeight = props.experienceWeight || 0;
    this.educationWeight = props.educationWeight || 0;
    this.locationWeight = props.locationWeight || 0;
    this.salaryWeight = props.salaryWeight || 0;
    this.customWeights = props.customWeights || {};
    this.isActive = props.isActive !== undefined ? props.isActive : true;

    this.validate();
  }

  validate() {
    if (!this.name) {
      throw new Error('Criteria name is required');
    }

    const totalWeight = this.experienceWeight + this.educationWeight +
                       this.locationWeight + this.salaryWeight +
                       Object.values(this.skillWeights).reduce((sum, weight) => sum + weight, 0) +
                       Object.values(this.customWeights).reduce((sum, weight) => sum + weight, 0);

    if (totalWeight > 1) {
      throw new Error('Total weight cannot exceed 1.0');
    }
  }

  getTotalWeight() {
    return this.experienceWeight + this.educationWeight +
           this.locationWeight + this.salaryWeight +
           Object.values(this.skillWeights).reduce((sum, weight) => sum + weight, 0) +
           Object.values(this.customWeights).reduce((sum, weight) => sum + weight, 0);
  }

  addSkillWeight(skillId, weight) {
    if (weight < 0 || weight > 1) {
      throw new Error('Skill weight must be between 0 and 1');
    }
    this.skillWeights[skillId] = weight;
    this.validate();
  }

  removeSkillWeight(skillId) {
    delete this.skillWeights[skillId];
  }

  addCustomWeight(key, weight) {
    if (weight < 0 || weight > 1) {
      throw new Error('Custom weight must be between 0 and 1');
    }
    this.customWeights[key] = weight;
    this.validate();
  }

  removeCustomWeight(key) {
    delete this.customWeights[key];
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      skillWeights: this.skillWeights,
      experienceWeight: this.experienceWeight,
      educationWeight: this.educationWeight,
      locationWeight: this.locationWeight,
      salaryWeight: this.salaryWeight,
      customWeights: this.customWeights,
      isActive: this.isActive,
      totalWeight: this.getTotalWeight()
    };
  }
}

module.exports = MatchingCriteria;