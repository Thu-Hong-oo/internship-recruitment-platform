const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetSystemStatsUseCase
 * Application layer use case for getting system statistics
 */
class GetSystemStatsUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute() {
    const stats = await this.adminRepository.getSystemStats();

    return {
      stats: {
        totalUsers: stats.totalUsers,
        totalJobs: stats.totalJobs,
        totalApplications: stats.totalApplications,
        jobsByStatus: stats.jobsByStatus,
        usersByRole: stats.usersByRole,
        generatedAt: new Date(),
      },
    };
  }
}

module.exports = GetSystemStatsUseCase;
