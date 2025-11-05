/**
 * SkillRoadmap Entity
 * Domain: Skill Development
 * Represents a personalized skill development roadmap for a candidate
 */
class SkillRoadmap {
  constructor(props) {
    this._roadmapId = props.roadmapId;
    this._candidateId = props.candidateId;
    this._title = props.title;
    this._description = props.description || null;
    this._goals = props.goals || [];
    this._skillGaps = props.skillGaps || []; // Array of SkillGapAnalysis IDs
    this._recommendedCourses = props.recommendedCourses || [];
    this._estimatedDuration = props.estimatedDuration || null; // in weeks
    this._status = props.status || 'draft'; // draft, active, completed, paused
    this._progress = props.progress || 0; // percentage 0-100

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._completedAt = props.completedAt || null;

    this.validate();
  }

  validate() {
    if (!this._roadmapId) {
      throw new Error('Roadmap ID is required');
    }
    if (!this._candidateId) {
      throw new Error('Candidate ID is required');
    }
    if (!this._title) {
      throw new Error('Title is required');
    }
    if (!Array.isArray(this._goals)) {
      throw new Error('Goals must be an array');
    }
    if (!Array.isArray(this._skillGaps)) {
      throw new Error('Skill gaps must be an array');
    }
    if (!Array.isArray(this._recommendedCourses)) {
      throw new Error('Recommended courses must be an array');
    }
    if (this._progress < 0 || this._progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    if (!['draft', 'active', 'completed', 'paused'].includes(this._status)) {
      throw new Error('Invalid status');
    }
  }

  // Getters
  get roadmapId() {
    return this._roadmapId;
  }

  get candidateId() {
    return this._candidateId;
  }

  get title() {
    return this._title;
  }

  get description() {
    return this._description;
  }

  get goals() {
    return [...this._goals];
  }

  get skillGaps() {
    return [...this._skillGaps];
  }

  get recommendedCourses() {
    return [...this._recommendedCourses];
  }

  get estimatedDuration() {
    return this._estimatedDuration;
  }

  get status() {
    return this._status;
  }

  get progress() {
    return this._progress;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  get completedAt() {
    return this._completedAt;
  }

  /**
   * Update roadmap details
   * @param {Object} updates
   */
  update(updates) {
    if (updates.title) this._title = updates.title;
    if (updates.description !== undefined)
      this._description = updates.description;
    if (updates.goals) this._goals = [...updates.goals];
    if (updates.skillGaps) this._skillGaps = [...updates.skillGaps];
    if (updates.recommendedCourses)
      this._recommendedCourses = [...updates.recommendedCourses];
    if (updates.estimatedDuration !== undefined)
      this._estimatedDuration = updates.estimatedDuration;
    if (updates.status) this._status = updates.status;
    if (updates.progress !== undefined) this._progress = updates.progress;

    this._updatedAt = new Date();

    if (this._status === 'completed' && !this._completedAt) {
      this._completedAt = new Date();
    }

    this.validate();
  }

  /**
   * Add a skill gap to the roadmap
   * @param {string} skillGapId
   */
  addSkillGap(skillGapId) {
    if (!this._skillGaps.includes(skillGapId)) {
      this._skillGaps.push(skillGapId);
      this._updatedAt = new Date();
    }
  }

  /**
   * Remove a skill gap from the roadmap
   * @param {string} skillGapId
   */
  removeSkillGap(skillGapId) {
    const index = this._skillGaps.indexOf(skillGapId);
    if (index > -1) {
      this._skillGaps.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  /**
   * Add a recommended course
   * @param {Object} course
   */
  addRecommendedCourse(course) {
    this._recommendedCourses.push(course);
    this._updatedAt = new Date();
  }

  /**
   * Update progress
   * @param {number} progress
   */
  updateProgress(progress) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this._progress = progress;
    this._updatedAt = new Date();

    if (progress === 100 && this._status !== 'completed') {
      this._status = 'completed';
      this._completedAt = new Date();
    }
  }

  /**
   * Activate the roadmap
   */
  activate() {
    this._status = 'active';
    this._updatedAt = new Date();
  }

  /**
   * Pause the roadmap
   */
  pause() {
    this._status = 'paused';
    this._updatedAt = new Date();
  }

  /**
   * Complete the roadmap
   */
  complete() {
    this._status = 'completed';
    this._progress = 100;
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Check if roadmap is active
   * @returns {boolean}
   */
  isActive() {
    return this._status === 'active';
  }

  /**
   * Check if roadmap is completed
   * @returns {boolean}
   */
  isCompleted() {
    return this._status === 'completed';
  }

  /**
   * Get roadmap duration in weeks
   * @returns {number|null}
   */
  getDurationInWeeks() {
    return this._estimatedDuration;
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      roadmapId: this._roadmapId,
      candidateId: this._candidateId,
      title: this._title,
      description: this._description,
      goals: this._goals,
      skillGaps: this._skillGaps,
      recommendedCourses: this._recommendedCourses,
      estimatedDuration: this._estimatedDuration,
      status: this._status,
      progress: this._progress,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      completedAt: this._completedAt,
    };
  }
}

module.exports = SkillRoadmap;
