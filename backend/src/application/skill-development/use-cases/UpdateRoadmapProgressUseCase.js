/**
 * Update Roadmap Progress Use Case
 * Updates progress for a specific roadmap phase or milestone
 */

class UpdateRoadmapProgressUseCase {
  constructor(skillRoadmapRepository, learningProgressRepository) {
    this.skillRoadmapRepository = skillRoadmapRepository;
    this.learningProgressRepository = learningProgressRepository;
  }

  async execute(roadmapId, phaseId, candidateId, progressData) {
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

      // Get or create progress record
      let progress = await this.learningProgressRepository.findByPhaseId(
        phaseId
      );
      if (!progress) {
        progress = {
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
      }

      // Update progress based on progressData
      if (progressData.milestoneId) {
        await this._updateMilestoneProgress(progress, progressData);
      }

      if (progressData.resourceId) {
        await this._updateResourceProgress(progress, progressData);
      }

      if (progressData.timeSpent) {
        progress.timeSpent += progressData.timeSpent;
      }

      if (progressData.notes) {
        progress.notes = progressData.notes;
      }

      // Update status based on completion
      progress.status = this._calculatePhaseStatus(progress);
      progress.lastActivity = new Date();
      progress.updatedAt = new Date();

      // Save progress
      const savedProgress = progress.id
        ? await this.learningProgressRepository.update(progress.id, progress)
        : await this.learningProgressRepository.create(progress);

      // Check if roadmap status needs update
      await this._updateRoadmapStatusIfNeeded(roadmapId);

      return {
        success: true,
        data: savedProgress,
        message: 'Progress updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _updateMilestoneProgress(progress, progressData) {
    const { milestoneId, completed, completedAt } = progressData;

    if (!progress.milestoneProgress) {
      progress.milestoneProgress = {};
    }

    const wasCompleted =
      progress.milestoneProgress[milestoneId]?.completed || false;

    progress.milestoneProgress[milestoneId] = {
      completed,
      completedAt: completed ? completedAt || new Date() : null,
      updatedAt: new Date(),
    };

    // Update completed count
    if (completed && !wasCompleted) {
      progress.completedMilestones++;
    } else if (!completed && wasCompleted) {
      progress.completedMilestones--;
    }

    progress.completedMilestones = Math.max(0, progress.completedMilestones);
  }

  async _updateResourceProgress(progress, progressData) {
    const { resourceId, completed, timeSpent, completedAt } = progressData;

    if (!progress.resourceProgress) {
      progress.resourceProgress = {};
    }

    const wasCompleted =
      progress.resourceProgress[resourceId]?.completed || false;

    progress.resourceProgress[resourceId] = {
      completed,
      timeSpent: timeSpent || 0,
      completedAt: completed ? completedAt || new Date() : null,
      updatedAt: new Date(),
    };

    // Update completed count
    if (completed && !wasCompleted) {
      progress.completedResources++;
    } else if (!completed && wasCompleted) {
      progress.completedResources--;
    }

    progress.completedResources = Math.max(0, progress.completedResources);
  }

  _calculatePhaseStatus(progress) {
    const milestoneCompletion =
      progress.totalMilestones > 0
        ? progress.completedMilestones / progress.totalMilestones
        : 0;
    const resourceCompletion =
      progress.totalResources > 0
        ? progress.completedResources / progress.totalResources
        : 0;

    const overallCompletion = (milestoneCompletion + resourceCompletion) / 2;

    if (overallCompletion >= 1.0) return 'completed';
    if (overallCompletion > 0) return 'in_progress';
    return 'not_started';
  }

  async _updateRoadmapStatusIfNeeded(roadmapId) {
    const roadmap = await this.skillRoadmapRepository.findById(roadmapId);
    if (!roadmap) return;

    // Get progress for all phases
    const phaseProgresses = await Promise.all(
      roadmap.phases.map(phase =>
        this.learningProgressRepository.findByPhaseId(phase.id)
      )
    );

    // Calculate overall status
    const completedPhases = phaseProgresses.filter(
      progress => progress && progress.status === 'completed'
    ).length;

    const inProgressPhases = phaseProgresses.filter(
      progress => progress && progress.status === 'in_progress'
    ).length;

    let newStatus = 'not_started';
    if (completedPhases === roadmap.phases.length) {
      newStatus = 'completed';
    } else if (inProgressPhases > 0 || completedPhases > 0) {
      newStatus = 'in_progress';
    }

    // Update roadmap status if changed
    if (roadmap.status !== newStatus) {
      await this.skillRoadmapRepository.update(roadmapId, {
        status: newStatus,
        updatedAt: new Date(),
      });
    }
  }
}

module.exports = UpdateRoadmapProgressUseCase;
