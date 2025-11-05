const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetSystemReportsUseCase
 * Use case for retrieving system reports
 */
class GetSystemReportsUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(options = {}) {
    try {
      const reports = await this.adminRepository.getSystemReports(options);
      return {
        reports: reports.reports || [],
      };
    } catch (error) {
      throw new Error(`Failed to get system reports: ${error.message}`);
    }
  }
}

module.exports = GetSystemReportsUseCase;
