/**
 * Get User Roadmaps Use Case
 * Retrieves all roadmaps for a specific candidate
 */

class GetUserRoadmapsUseCase {
  constructor(skillRoadmapRepository, learningProgressRepository) {
    this.skillRoadmapRepository = skillRoadmapRepository;
    this.learningProgressRepository = learningProgressRepository;
  }

  async execute(candidateId, filters = {}) {
    try {
      // Build query filters
      const queryFilters = {
        candidateId,
        ...filters,
      };

      // Get roadmaps
      const roadmaps = await this.skillRoadmapRepository.findByCandidateId(
        candidateId,
        queryFilters
      );

      // Get progress for each roadmap
      const roadmapsWithProgress = await Promise.all(
        roadmaps.map(async roadmap => {
          const progressData = await this._getRoadmapProgress(roadmap);
          return {
            ...roadmap,
            progress: progressData,
          };
        })
      );

      // Sort by status and last activity
      const sortedRoadmaps = roadmapsWithProgress.sort((a, b) => {
        // Active/in-progress first, then by last activity
        const statusOrder = {
          in_progress: 0,
          active: 1,
          completed: 2,
          paused: 3,
          archived: 4,
        };
        const statusDiff =
          (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);

        if (statusDiff !== 0) return statusDiff;

        // Then by last activity (most recent first)
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

      return {
        success: true,
        data: sortedRoadmaps,
        meta: {
          total: roadmaps.length,
          active: roadmaps.filter(
            r => r.status === 'active' || r.status === 'in_progress'
          ).length,
          completed: roadmaps.filter(r => r.status === 'completed').length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async _getRoadmapProgress(roadmap) {
    const phaseProgresses = await Promise.all(
      roadmap.phases.map(async phase => {
        const progress = await this.learningProgressRepository.findByPhaseId(
          phase.id
        );
        return (
          progress || {
            phaseId: phase.id,
            status: 'not_started',
            completedMilestones: 0,
            totalMilestones: phase.milestones?.length || 0,
            completedResources: 0,
            totalResources: phase.resources?.length || 0,
          }
        );
      })
    );

    const totalPhases = roadmap.phases.length;
    const completedPhases = phaseProgresses.filter(
      p => p.status === 'completed'
    ).length;
    const inProgressPhases = phaseProgresses.filter(
      p => p.status === 'in_progress'
    ).length;

    const totalMilestones = phaseProgresses.reduce(
      (sum, p) => sum + (p.totalMilestones || 0),
      0
    );
    const completedMilestones = phaseProgresses.reduce(
      (sum, p) => sum + (p.completedMilestones || 0),
      0
    );

    const percentComplete =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

    return {
      percentComplete,
      completedPhases,
      totalPhases,
      inProgressPhases,
      completedMilestones,
      totalMilestones,
      currentPhase:
        phaseProgresses.find(p => p.status === 'in_progress') ||
        phaseProgresses.find(p => p.status === 'not_started'),
      lastActivity: this._getLastActivity(phaseProgresses),
    };
  }

  _getLastActivity(phaseProgresses) {
    const activities = phaseProgresses
      .map(p => p.lastActivity)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));

    return activities.length > 0 ? activities[0] : null;
  }
}

module.exports = GetUserRoadmapsUseCase;
