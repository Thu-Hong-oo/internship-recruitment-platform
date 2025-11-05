/**
 * LearningPath Entity
 * Domain: Learning
 * Represents a structured learning path for skill development
 */
class LearningPath {
  constructor(props) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description || '';
    this.learningPathType = props.learningPathType;
    this.targetSkills = props.targetSkills || [];
    this.estimatedDuration = props.estimatedDuration || 0; // in hours
    this.difficultyLevel = props.difficultyLevel || 'BEGINNER';
    this.prerequisites = props.prerequisites || [];
    this.learningModules = props.learningModules || [];
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.createdBy = props.createdBy;

    this.validate();
  }

  validate() {
    if (!this.title) {
      throw new Error('Learning path title is required');
    }
    if (!this.learningPathType) {
      throw new Error('Learning path type is required');
    }
    if (this.estimatedDuration < 0) {
      throw new Error('Estimated duration cannot be negative');
    }
  }

  addModule(moduleId) {
    if (!this.learningModules.includes(moduleId)) {
      this.learningModules.push(moduleId);
    }
  }

  removeModule(moduleId) {
    const index = this.learningModules.indexOf(moduleId);
    if (index > -1) {
      this.learningModules.splice(index, 1);
    }
  }

  addTargetSkill(skillId) {
    if (!this.targetSkills.includes(skillId)) {
      this.targetSkills.push(skillId);
    }
  }

  removeTargetSkill(skillId) {
    const index = this.targetSkills.indexOf(skillId);
    if (index > -1) {
      this.targetSkills.splice(index, 1);
    }
  }

  addPrerequisite(skillId) {
    if (!this.prerequisites.includes(skillId)) {
      this.prerequisites.push(skillId);
    }
  }

  removePrerequisite(skillId) {
    const index = this.prerequisites.indexOf(skillId);
    if (index > -1) {
      this.prerequisites.splice(index, 1);
    }
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  getTotalModules() {
    return this.learningModules.length;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      learningPathType: this.learningPathType,
      targetSkills: this.targetSkills,
      estimatedDuration: this.estimatedDuration,
      difficultyLevel: this.difficultyLevel,
      prerequisites: this.prerequisites,
      learningModules: this.learningModules,
      isActive: this.isActive,
      createdBy: this.createdBy,
      totalModules: this.getTotalModules()
    };
  }
}

module.exports = LearningPath;