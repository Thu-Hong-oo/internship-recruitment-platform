/**
 * Complete Roadmap Phase Use Case
 * Marks a specific roadmap phase as completed
 */

class CompleteRoadmapPhaseUseCase {
  constructor(
    skillRoadmapRepository,
    learningProgressRepository,
    candidateRepository
  ) {
    this.skillRoadmapRepository = skillRoadmapRepository;
    this.learningProgressRepository = learningProgressRepository;
    this.candidateRepository = candidateRepository;
  }

  async execute(roadmapId, phaseId, candidateId, completionData = {}) {
    try {
      // Verify roadmap ownership
      const roadmap = await this.skillRoadmapRepository.findById(roadmapId);
      if (!roadmap || roadmap.candidateId !== candidateId) {
        throw new Error('Roadmap not found or access denied');
      }

      // Find the phase
      const phase = roadmap.phases.find(p => p.id === phaseId);
      if (!phase) {
        throw new Error('Phase not found');
      }

      // Check prerequisites
      const prerequisitesMet = await this._checkPrerequisites(
        phase.prerequisites || []
      );
      if (!prerequisitesMet) {
        throw new Error('Prerequisites not met for this phase');
      }

      // Get or create progress record
      let progress = await this.learningProgressRepository.findByPhaseId(
        phaseId
      );
      if (!progress) {
        progress = await this._createInitialProgress(
          roadmapId,
          phaseId,
          candidateId,
          phase
        );
      }

      // Mark all milestones as completed if not already
      if (!progress.milestoneProgress) {
        progress.milestoneProgress = {};
      }

      phase.milestones.forEach(milestone => {
        if (!progress.milestoneProgress[milestone.id]) {
          progress.milestoneProgress[milestone.id] = {
            completed: true,
            completedAt: new Date(),
            updatedAt: new Date(),
          };
        }
      });

      // Mark all resources as completed if not already
      if (!progress.resourceProgress) {
        progress.resourceProgress = {};
      }

      phase.resources.forEach(resource => {
        if (!progress.resourceProgress[resource.id || resource.title]) {
          progress.resourceProgress[resource.id || resource.title] = {
            completed: true,
            timeSpent: completionData.timeSpent || 0,
            completedAt: new Date(),
            updatedAt: new Date(),
          };
        }
      });

      // Update completion counts
      progress.completedMilestones = phase.milestones.length;
      progress.completedResources = phase.resources.length;
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.lastActivity = new Date();
      progress.updatedAt = new Date();

      if (completionData.notes) {
        progress.notes = completionData.notes;
      }

      if (completionData.timeSpent) {
        progress.timeSpent += completionData.timeSpent;
      }

      // Save progress
      const savedProgress = await this.learningProgressRepository.update(
        progress.id,
        progress
      );

      // Add skills to candidate profile
      await this._addSkillsToCandidate(candidateId, phase.skills);

      // Update roadmap status
      await this._updateRoadmapStatus(roadmapId);

      // Check for achievements/badges
      const achievements = await this._checkAchievements(
        candidateId,
        roadmapId,
        phaseId
      );

      return {
        success: true,
        data: {
          progress: savedProgress,
          phase: phase,
          achievements: achievements,
          nextPhase: this._findNextPhase(roadmap, phaseId),
        },
        message: `Phase "${phase.title}" completed successfully!`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _checkPrerequisites(prerequisites) {
    if (!prerequisites || prerequisites.length === 0) {
      return true;
    }

    for (const prereqPhaseId of prerequisites) {
      const prereqProgress =
        await this.learningProgressRepository.findByPhaseId(prereqPhaseId);
      if (!prereqProgress || prereqProgress.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  async _createInitialProgress(roadmapId, phaseId, candidateId, phase) {
    const progressData = {
      roadmapId,
      phaseId,
      candidateId,
      completedMilestones: 0,
      totalMilestones: phase.milestones.length,
      completedResources: 0,
      totalResources: phase.resources.length,
      timeSpent: 0,
      status: 'not_started',
      lastActivity: new Date(),
      milestoneProgress: {},
      resourceProgress: {},
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.learningProgressRepository.create(progressData);
  }

  async _addSkillsToCandidate(candidateId, phaseSkills) {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) return;

      const currentSkills = candidate.skills || [];
      const newSkills = phaseSkills.filter(
        skill =>
          !currentSkills.some(existing => existing.skillId === skill.skillId)
      );

      if (newSkills.length > 0) {
        const updatedSkills = [
          ...currentSkills,
          ...newSkills.map(skill => ({
            skillId: skill.skillId,
            name: skill.name,
            level: skill.level || 'beginner',
            verified: false,
            addedAt: new Date(),
            source: 'roadmap_completion',
          })),
        ];

        await this.candidateRepository.update(candidateId, {
          skills: updatedSkills,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error adding skills to candidate:', error);
      // Don't fail the main operation if skill addition fails
    }
  }

  async _updateRoadmapStatus(roadmapId) {
    const roadmap = await this.skillRoadmapRepository.findById(roadmapId);
    if (!roadmap) return;

    const phaseProgresses = await Promise.all(
      roadmap.phases.map(phase =>
        this.learningProgressRepository.findByPhaseId(phase.id)
      )
    );

    const completedPhases = phaseProgresses.filter(
      progress => progress && progress.status === 'completed'
    ).length;

    let newStatus = roadmap.status;
    if (completedPhases === roadmap.phases.length) {
      newStatus = 'completed';
    } else if (completedPhases > 0) {
      newStatus = 'in_progress';
    }

    if (roadmap.status !== newStatus) {
      await this.skillRoadmapRepository.update(roadmapId, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null,
        updatedAt: new Date(),
      });
    }
  }

  async _checkAchievements(candidateId, roadmapId, phaseId) {
    const achievements = [];

    // Check for phase completion achievement
    achievements.push({
      type: 'phase_completed',
      title: 'Phase Master',
      description: 'Successfully completed a learning phase',
      earnedAt: new Date(),
    });

    // Check for roadmap completion achievement
    const roadmap = await this.skillRoadmapRepository.findById(roadmapId);
    if (roadmap) {
      const allProgresses = await Promise.all(
        roadmap.phases.map(phase =>
          this.learningProgressRepository.findByPhaseId(phase.id)
        )
      );

      const completedCount = allProgresses.filter(
        p => p && p.status === 'completed'
      ).length;

      if (completedCount === roadmap.phases.length) {
        achievements.push({
          type: 'roadmap_completed',
          title: 'Roadmap Champion',
          description: 'Completed an entire skill development roadmap',
          earnedAt: new Date(),
        });
      }

      // Check for streak achievements
      if (completedCount >= 3) {
        achievements.push({
          type: 'learning_streak',
          title: 'Consistent Learner',
          description: 'Completed multiple phases in a roadmap',
          earnedAt: new Date(),
        });
      }
    }

    return achievements;
  }

  _findNextPhase(roadmap, currentPhaseId) {
    const currentPhaseIndex = roadmap.phases.findIndex(
      p => p.id === currentPhaseId
    );

    if (
      currentPhaseIndex >= 0 &&
      currentPhaseIndex < roadmap.phases.length - 1
    ) {
      return roadmap.phases[currentPhaseIndex + 1];
    }

    return null;
  }
}

module.exports = CompleteRoadmapPhaseUseCase;
