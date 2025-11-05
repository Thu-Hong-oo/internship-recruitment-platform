/**
 * LearningRoadmap Domain Entity
 * Represents a personalized learning path for skill development
 *
 * Business Rules:
 * - Must have target job or job title
 * - Tracks current skills vs target skills
 * - Identifies skill gaps automatically
 * - Progress is calculated from completed phases
 * - Phases must be completed in order
 * - Cannot modify roadmap once started without resetting progress
 */

const RoadmapStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
};

class LearningRoadmap {
  constructor(
    id,
    candidateId,
    targetJobTitle,
    currentSkills,
    targetSkills,
    skillGaps,
    phases,
    status = RoadmapStatus.DRAFT,
    targetJobId = null,
    progress = 0,
    estimatedDuration = 0,
    startedAt = null,
    completedAt = null,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.candidateId = candidateId;
    this.targetJobTitle = targetJobTitle;
    this.currentSkills = currentSkills || [];
    this.targetSkills = targetSkills || [];
    this.skillGaps = skillGaps || [];
    this.phases = phases || [];
    this.status = status;
    this.targetJobId = targetJobId;
    this.progress = progress;
    this.estimatedDuration = estimatedDuration;
    this.startedAt = startedAt;
    this.completedAt = completedAt;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    if (!this.id) {
      throw new Error('Roadmap ID is required');
    }

    if (!this.candidateId) {
      throw new Error('Candidate ID is required');
    }

    if (!this.targetJobTitle) {
      throw new Error('Target job title is required');
    }

    if (!Array.isArray(this.currentSkills)) {
      throw new Error('Current skills must be an array');
    }

    if (!Array.isArray(this.targetSkills)) {
      throw new Error('Target skills must be an array');
    }

    if (!Array.isArray(this.phases)) {
      throw new Error('Phases must be an array');
    }

    if (!this.status || !Object.values(RoadmapStatus).includes(this.status)) {
      throw new Error('Valid status is required');
    }

    if (this.progress < 0 || this.progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
  }

  // ============================================
  // Phase Management
  // ============================================

  addPhase(name, description, skills, duration, resources = []) {
    if (this.status !== RoadmapStatus.DRAFT) {
      throw new Error('Can only add phases to draft roadmap');
    }

    const phase = {
      id: `phase_${Date.now()}_${this.phases.length}`,
      order: this.phases.length + 1,
      name,
      description,
      skills: skills || [],
      duration, // in days
      resources: resources || [],
      completed: false,
      completedAt: null,
      startedAt: null,
    };

    this.phases.push(phase);
    this.calculateEstimatedDuration();
    this.updatedAt = new Date();
  }

  removePhase(phaseId) {
    if (this.status !== RoadmapStatus.DRAFT) {
      throw new Error('Can only remove phases from draft roadmap');
    }

    const index = this.phases.findIndex(p => p.id === phaseId);
    if (index === -1) {
      throw new Error('Phase not found');
    }

    this.phases.splice(index, 1);

    // Reorder phases
    this.phases.forEach((phase, idx) => {
      phase.order = idx + 1;
    });

    this.calculateEstimatedDuration();
    this.updatedAt = new Date();
  }

  getPhase(phaseId) {
    return this.phases.find(p => p.id === phaseId) || null;
  }

  getCurrentPhase() {
    if (this.status !== RoadmapStatus.ACTIVE) {
      return null;
    }

    // Find first incomplete phase
    return this.phases.find(p => !p.completed) || null;
  }

  markPhaseComplete(phaseId) {
    if (this.status !== RoadmapStatus.ACTIVE) {
      throw new Error('Roadmap must be active to mark phase complete');
    }

    const phase = this.getPhase(phaseId);
    if (!phase) {
      throw new Error('Phase not found');
    }

    if (phase.completed) {
      throw new Error('Phase already completed');
    }

    // Check if previous phases are completed
    const phaseIndex = this.phases.findIndex(p => p.id === phaseId);
    for (let i = 0; i < phaseIndex; i++) {
      if (!this.phases[i].completed) {
        throw new Error('Previous phases must be completed first');
      }
    }

    phase.completed = true;
    phase.completedAt = new Date();

    this.calculateProgress();
    this.updatedAt = new Date();

    // Check if roadmap is complete
    if (this.progress === 100) {
      this.complete();
    }
  }

  startPhase(phaseId) {
    if (this.status !== RoadmapStatus.ACTIVE) {
      throw new Error('Roadmap must be active');
    }

    const phase = this.getPhase(phaseId);
    if (!phase) {
      throw new Error('Phase not found');
    }

    if (phase.completed) {
      throw new Error('Cannot start completed phase');
    }

    if (phase.startedAt) {
      return; // Already started
    }

    phase.startedAt = new Date();
    this.updatedAt = new Date();
  }

  // ============================================
  // Progress Tracking
  // ============================================

  calculateProgress() {
    if (this.phases.length === 0) {
      this.progress = 0;
      return 0;
    }

    const completedCount = this.phases.filter(p => p.completed).length;
    this.progress = Math.round((completedCount / this.phases.length) * 100);
    return this.progress;
  }

  calculateEstimatedDuration() {
    this.estimatedDuration = this.phases.reduce((total, phase) => {
      return total + (phase.duration || 0);
    }, 0);
    return this.estimatedDuration;
  }

  getCompletedPhases() {
    return this.phases.filter(p => p.completed);
  }

  getRemainingPhases() {
    return this.phases.filter(p => !p.completed);
  }

  getEstimatedTimeRemaining() {
    const remaining = this.getRemainingPhases();
    return remaining.reduce((total, phase) => total + (phase.duration || 0), 0);
  }

  // ============================================
  // Skill Gap Analysis
  // ============================================

  calculateSkillGaps() {
    // Find skills in target that are not in current
    this.skillGaps = this.targetSkills.filter(
      skill => !this.currentSkills.includes(skill)
    );

    this.updatedAt = new Date();
    return this.skillGaps;
  }

  addCurrentSkill(skill) {
    if (!this.currentSkills.includes(skill)) {
      this.currentSkills.push(skill);
      this.calculateSkillGaps();
      this.updatedAt = new Date();
    }
  }

  removeCurrentSkill(skill) {
    const index = this.currentSkills.indexOf(skill);
    if (index > -1) {
      this.currentSkills.splice(index, 1);
      this.calculateSkillGaps();
      this.updatedAt = new Date();
    }
  }

  addTargetSkill(skill) {
    if (!this.targetSkills.includes(skill)) {
      this.targetSkills.push(skill);
      this.calculateSkillGaps();
      this.updatedAt = new Date();
    }
  }

  hasSkillGap() {
    return this.skillGaps.length > 0;
  }

  getSkillGapPercentage() {
    if (this.targetSkills.length === 0) {
      return 0;
    }

    return Math.round((this.skillGaps.length / this.targetSkills.length) * 100);
  }

  // ============================================
  // Status Management
  // ============================================

  start() {
    if (this.status !== RoadmapStatus.DRAFT) {
      throw new Error('Can only start draft roadmap');
    }

    if (this.phases.length === 0) {
      throw new Error('Cannot start roadmap without phases');
    }

    this.status = RoadmapStatus.ACTIVE;
    this.startedAt = new Date();
    this.updatedAt = new Date();
  }

  pause() {
    if (this.status !== RoadmapStatus.ACTIVE) {
      throw new Error('Can only pause active roadmap');
    }

    this.status = RoadmapStatus.PAUSED;
    this.updatedAt = new Date();
  }

  resume() {
    if (this.status !== RoadmapStatus.PAUSED) {
      throw new Error('Can only resume paused roadmap');
    }

    this.status = RoadmapStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  complete() {
    if (this.status !== RoadmapStatus.ACTIVE) {
      throw new Error('Can only complete active roadmap');
    }

    if (this.progress < 100) {
      throw new Error('Cannot complete roadmap with incomplete phases');
    }

    this.status = RoadmapStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  abandon() {
    if (this.status === RoadmapStatus.COMPLETED) {
      throw new Error('Cannot abandon completed roadmap');
    }

    this.status = RoadmapStatus.ABANDONED;
    this.updatedAt = new Date();
  }

  isActive() {
    return this.status === RoadmapStatus.ACTIVE;
  }

  isCompleted() {
    return this.status === RoadmapStatus.COMPLETED;
  }

  isDraft() {
    return this.status === RoadmapStatus.DRAFT;
  }

  // ============================================
  // Business Logic Queries
  // ============================================

  canBeStarted() {
    return this.status === RoadmapStatus.DRAFT && this.phases.length > 0;
  }

  canBeModified() {
    return this.status === RoadmapStatus.DRAFT;
  }

  getDaysActive() {
    if (!this.startedAt) {
      return 0;
    }

    const endDate = this.completedAt || new Date();
    return Math.floor((endDate - this.startedAt) / (1000 * 60 * 60 * 24));
  }

  isOnTrack() {
    if (!this.isActive() || this.estimatedDuration === 0) {
      return true;
    }

    const daysActive = this.getDaysActive();
    const expectedProgress = (daysActive / this.estimatedDuration) * 100;

    // Within 10% tolerance
    return Math.abs(this.progress - expectedProgress) <= 10;
  }

  isBehindSchedule() {
    if (!this.isActive() || this.estimatedDuration === 0) {
      return false;
    }

    const daysActive = this.getDaysActive();
    const expectedProgress = (daysActive / this.estimatedDuration) * 100;

    return this.progress < expectedProgress - 10;
  }

  isAheadOfSchedule() {
    if (!this.isActive() || this.estimatedDuration === 0) {
      return false;
    }

    const daysActive = this.getDaysActive();
    const expectedProgress = (daysActive / this.estimatedDuration) * 100;

    return this.progress > expectedProgress + 10;
  }

  // ============================================
  // Display Information
  // ============================================

  getSummary() {
    return {
      id: this.id,
      targetJobTitle: this.targetJobTitle,
      status: this.status,
      progress: this.progress,
      totalPhases: this.phases.length,
      completedPhases: this.getCompletedPhases().length,
      skillGaps: this.skillGaps.length,
      estimatedDuration: this.estimatedDuration,
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      isOnTrack: this.isOnTrack(),
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }
}

// Export class and constants
LearningRoadmap.Status = RoadmapStatus;

module.exports = LearningRoadmap;
