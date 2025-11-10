const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * UpdateCandidateStatusUseCase
 * Application layer use case for updating candidate status
 */
class UpdateCandidateStatusUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(candidateId, updateData) {
    if (!candidateId) {
      throw new Error('Candidate ID is required');
    }

    if (!updateData || !updateData.status) {
      throw new Error('Status is required');
    }

    const candidate = await this.adminRepository.updateCandidateStatus(candidateId, updateData);

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return {
      message: 'Candidate status updated successfully',
      candidate,
    };
  }
}

module.exports = UpdateCandidateStatusUseCase;