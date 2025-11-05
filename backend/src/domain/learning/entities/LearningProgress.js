/**
 * LearningProgress Entity
 * Domain: Learning
 * Represents a user's progress through a learning path or module
 */
class LearningProgress {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.learningPathId = props.learningPathId;
    this.currentModuleId = props.currentModuleId;
    this.progressStatus = props.progressStatus;
    this.progressPercentage = props.progressPercentage || 0;
    this.completedModules = props.completedModules || [];
    this.timeSpent = props.timeSpent || 0; // in minutes
    this.startedAt = props.startedAt;
    this.lastAccessedAt = props.lastAccessedAt;
    this.completedAt = props.completedAt;
    this.notes = props.notes || '';

    this.validate();
  }

  validate() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    if (!this.learningPathId) {
      throw new Error('Learning path ID is required');
    }
    if (!this.progressStatus) {
      throw new Error('Progress status is required');
    }
    if (this.progressPercentage < 0 || this.progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }
    if (this.timeSpent < 0) {
      throw new Error('Time spent cannot be negative');
    }
  }

  isCompleted() {
    return this.progressStatus === 'COMPLETED';
  }

  isInProgress() {
    return this.progressStatus === 'IN_PROGRESS';
  }

  isNotStarted() {
    return this.progressStatus === 'NOT_STARTED';
  }

  markCompleted() {
    this.progressStatus = 'COMPLETED';
    this.progressPercentage = 100;
    this.completedAt = new Date();
  }

  markInProgress() {
    this.progressStatus = 'IN_PROGRESS';
    this.lastAccessedAt = new Date();
  }

  updateProgress(percentage, timeSpentIncrement = 0) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }
    this.progressPercentage = percentage;
    this.timeSpent += timeSpentIncrement;
    this.lastAccessedAt = new Date();

    if (percentage === 100 && !this.isCompleted()) {
      this.markCompleted();
    }
  }

  completeModule(moduleId) {
    if (!this.completedModules.includes(moduleId)) {
      this.completedModules.push(moduleId);
      this.updateProgress(this.calculateProgressPercentage());
    }
  }

  setCurrentModule(moduleId) {
    this.currentModuleId = moduleId;
    this.markInProgress();
  }

  calculateProgressPercentage() {
    // This would need to know total modules, but for now return current percentage
    return this.progressPercentage;
  }

  addNote(note) {
    this.notes += (this.notes ? '\n' : '') + note;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      learningPathId: this.learningPathId,
      currentModuleId: this.currentModuleId,
      progressStatus: this.progressStatus,
      progressPercentage: this.progressPercentage,
      completedModules: this.completedModules,
      timeSpent: this.timeSpent,
      startedAt: this.startedAt,
      lastAccessedAt: this.lastAccessedAt,
      completedAt: this.completedAt,
      notes: this.notes,
      isCompleted: this.isCompleted()
    };
  }
}

module.exports = LearningProgress;