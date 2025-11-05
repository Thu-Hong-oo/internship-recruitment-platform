/**
 * Get Roadmap Progress Use Case
 * Retrieves progress information for a specific roadmap
 */

class GetRoadmapProgressUseCase {
  constructor(skillRoadmapRepository, learningProgressRepository) {
    this.skillRoadmapRepository = skillRoadmapRepository;
    this.learningProgressRepository = learningProgressRepository;
  }

  async execute(roadmapId, candidateId) {
    try {
      // Get roadmap
      const roadmap = await this.skillRoadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      // Verify ownership
      if (roadmap.candidateId !== candidateId) {
        throw new Error('Access denied');
      }

      // Get detailed progress for each phase
      const progressDetails = await Promise.all(
        roadmap.phases.map(async phase => {
          const progress = await this.learningProgressRepository.findByPhaseId(
            phase.id
          );
          return {
            phase: phase,
            progress: progress || {
              phaseId: phase.id,
              completedMilestones: 0,
              totalMilestones: phase.milestones.length,
              completedResources: 0,
              totalResources: phase.resources.length,
              timeSpent: 0,
              status: 'not_started',
              lastActivity: null,
            },
          };
        })
      );

      // Calculate overall progress
      const overallProgress = this._calculateOverallProgress(progressDetails);

      return {
        success: true,
        data: {
          roadmap: {
            id: roadmap.id,
            title: roadmap.title,
            description: roadmap.description,
            status: roadmap.status,
            estimatedDuration: roadmap.estimatedDuration,
            difficulty: roadmap.difficulty,
            createdAt: roadmap.createdAt,
          },
          progress: {
            overall: overallProgress,
            phases: progressDetails,
            stats: this._calculateStats(progressDetails),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _calculateOverallProgress(progressDetails) {
    const totalPhases = progressDetails.length;
    const completedPhases = progressDetails.filter(
      detail => detail.progress.status === 'completed'
    ).length;
    const inProgressPhases = progressDetails.filter(
      detail => detail.progress.status === 'in_progress'
    ).length;

    const totalMilestones = progressDetails.reduce(
      (sum, detail) => sum + detail.progress.totalMilestones,
      0
    );
    const completedMilestones = progressDetails.reduce(
      (sum, detail) => sum + detail.progress.completedMilestones,
      0
    );

    const totalResources = progressDetails.reduce(
      (sum, detail) => sum + detail.progress.totalResources,
      0
    );
    const completedResources = progressDetails.reduce(
      (sum, detail) => sum + detail.progress.completedResources,
      0
    );

    const totalTimeSpent = progressDetails.reduce(
      (sum, detail) => sum + detail.progress.timeSpent,
      0
    );

    return {
      percentComplete:
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0,
      completedPhases,
      totalPhases,
      inProgressPhases,
      completedMilestones,
      totalMilestones,
      completedResources,
      totalResources,
      totalTimeSpent,
      status: this._determineOverallStatus(
        completedPhases,
        inProgressPhases,
        totalPhases
      ),
    };
  }

  _determineOverallStatus(completedPhases, inProgressPhases, totalPhases) {
    if (completedPhases === totalPhases) return 'completed';
    if (inProgressPhases > 0 || completedPhases > 0) return 'in_progress';
    return 'not_started';
  }

  _calculateStats(progressDetails) {
    const now = new Date();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let weeklyActivity = 0;
    let monthlyActivity = 0;
    let streak = 0;

    progressDetails.forEach(detail => {
      if (detail.progress.lastActivity) {
        const lastActivity = new Date(detail.progress.lastActivity);

        if (lastActivity >= thisWeekStart) {
          weeklyActivity += detail.progress.timeSpent;
        }

        if (lastActivity >= thisMonthStart) {
          monthlyActivity += detail.progress.timeSpent;
        }
      }
    });

    // Calculate streak (simplified)
    const recentActivities = progressDetails
      .map(detail => detail.progress.lastActivity)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));

    if (recentActivities.length > 0) {
      const lastActivity = new Date(recentActivities[0]);
      const daysDiff = Math.floor(
        (new Date() - lastActivity) / (1000 * 60 * 60 * 24)
      );
      streak = daysDiff <= 1 ? 1 : 0; // Simplified streak calculation
    }

    return {
      weeklyTimeSpent: weeklyActivity,
      monthlyTimeSpent: monthlyActivity,
      currentStreak: streak,
      averageSessionTime:
        progressDetails.length > 0
          ? progressDetails.reduce(
              (sum, detail) => sum + detail.progress.timeSpent,
              0
            ) / progressDetails.length
          : 0,
    };
  }
}

module.exports = GetRoadmapProgressUseCase;
