const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * UpdateSystemSettingsUseCase
 * Use case for updating system settings
 */
class UpdateSystemSettingsUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(settingsData) {
    try {
      if (!settingsData || typeof settingsData !== 'object') {
        throw new Error('Valid settings data is required');
      }

      const result = await this.adminRepository.updateSystemSettings(
        settingsData
      );
      return {
        message: result.message || 'System settings updated successfully',
        settings: result.settings || settingsData,
      };
    } catch (error) {
      throw new Error(`Failed to update system settings: ${error.message}`);
    }
  }
}

module.exports = UpdateSystemSettingsUseCase;
