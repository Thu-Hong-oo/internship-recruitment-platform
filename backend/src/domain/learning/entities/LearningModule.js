/**
 * LearningModule Entity
 * Domain: Learning
 * Represents a module within a learning path
 */
class LearningModule {
  constructor(props) {
    this.id = props.id;
    this.learningPathId = props.learningPathId;
    this.title = props.title;
    this.description = props.description || '';
    this.contentType = props.contentType;
    this.contentUrl = props.contentUrl || '';
    this.estimatedDuration = props.estimatedDuration || 0; // in minutes
    this.order = props.order || 0;
    this.prerequisites = props.prerequisites || []; // other module IDs
    this.skillsCovered = props.skillsCovered || [];
    this.isActive = props.isActive !== undefined ? props.isActive : true;

    this.validate();
  }

  validate() {
    if (!this.learningPathId) {
      throw new Error('Learning path ID is required');
    }
    if (!this.title) {
      throw new Error('Module title is required');
    }
    if (!this.contentType) {
      throw new Error('Content type is required');
    }
    if (this.estimatedDuration < 0) {
      throw new Error('Estimated duration cannot be negative');
    }
    if (this.order < 0) {
      throw new Error('Order cannot be negative');
    }
  }

  addPrerequisite(moduleId) {
    if (!this.prerequisites.includes(moduleId)) {
      this.prerequisites.push(moduleId);
    }
  }

  removePrerequisite(moduleId) {
    const index = this.prerequisites.indexOf(moduleId);
    if (index > -1) {
      this.prerequisites.splice(index, 1);
    }
  }

  addSkill(skillId) {
    if (!this.skillsCovered.includes(skillId)) {
      this.skillsCovered.push(skillId);
    }
  }

  removeSkill(skillId) {
    const index = this.skillsCovered.indexOf(skillId);
    if (index > -1) {
      this.skillsCovered.splice(index, 1);
    }
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
      learningPathId: this.learningPathId,
      title: this.title,
      description: this.description,
      contentType: this.contentType,
      contentUrl: this.contentUrl,
      estimatedDuration: this.estimatedDuration,
      order: this.order,
      prerequisites: this.prerequisites,
      skillsCovered: this.skillsCovered,
      isActive: this.isActive
    };
  }
}

module.exports = LearningModule;