const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * ClearQueueUseCase
 * Use case for clearing a queue
 */
class ClearQueueUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(queueName) {
    try {
      if (!queueName) {
        throw new Error('Queue name is required');
      }

      const result = await this.adminRepository.clearQueue(queueName);
      return {
        message: result.message || `Queue ${queueName} cleared successfully`,
      };
    } catch (error) {
      throw new Error(`Failed to clear queue: ${error.message}`);
    }
  }
}

module.exports = ClearQueueUseCase;
