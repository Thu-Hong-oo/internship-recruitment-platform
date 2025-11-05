const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetQueueStatusUseCase
 * Use case for retrieving queue status
 */
class GetQueueStatusUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute() {
    try {
      const queues = await this.adminRepository.getQueueStatus();
      return {
        queues: queues.queues || [],
      };
    } catch (error) {
      throw new Error(`Failed to get queue status: ${error.message}`);
    }
  }
}

module.exports = GetQueueStatusUseCase;
