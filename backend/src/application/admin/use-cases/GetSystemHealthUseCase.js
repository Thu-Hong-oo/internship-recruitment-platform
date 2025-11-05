const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetSystemHealthUseCase
 * Use case for retrieving system health status
 */
class GetSystemHealthUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute() {
    try {
      const health = await this.adminRepository.getSystemHealth();
      return {
        health: health.health || {},
      };
    } catch (error) {
      throw new Error(`Failed to get system health: ${error.message}`);
    }
  }
}

module.exports = GetSystemHealthUseCase;
