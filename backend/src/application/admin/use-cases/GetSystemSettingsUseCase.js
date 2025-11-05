const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetSystemSettingsUseCase
 * Use case for retrieving system settings
 */
class GetSystemSettingsUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute() {
    try {
      const settings = await this.adminRepository.getSystemSettings();
      return {
        settings: settings.settings || {},
      };
    } catch (error) {
      throw new Error(`Failed to get system settings: ${error.message}`);
    }
  }
}

module.exports = GetSystemSettingsUseCase;
