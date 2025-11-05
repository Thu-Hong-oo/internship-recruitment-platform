const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetSystemLogsUseCase
 * Use case for retrieving system logs
 */
class GetSystemLogsUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(options = {}) {
    try {
      const logs = await this.adminRepository.getSystemLogs(options);
      return {
        logs: logs.logs || [],
        pagination: logs.pagination || null,
      };
    } catch (error) {
      throw new Error(`Failed to get system logs: ${error.message}`);
    }
  }
}

module.exports = GetSystemLogsUseCase;
