const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetAllCandidatesUseCase
 * Application layer use case for getting all candidates
 */
class GetAllCandidatesUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(options = {}) {
    const result = await this.adminRepository.getAllCandidates(options);

    return {
      success: true,
      candidates: result.candidates,
      pagination: result.pagination,
    };
  }
}

module.exports = GetAllCandidatesUseCase;