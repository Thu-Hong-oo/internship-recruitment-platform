const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetCandidateByIdUseCase
 * Application layer use case for getting a candidate by ID
 */
class GetCandidateByIdUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(candidateId) {
    if (!candidateId) {
      throw new Error('Candidate ID is required');
    }

    const candidate = await this.adminRepository.getCandidateById(candidateId);

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return {
      candidate: {
        id: candidate._id,
        email: candidate.email,
        fullName: candidate.fullName,
        role: candidate.role,
        status: candidate.status,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
        profile: candidate.candidateProfile,
        avatarUrl: candidate.avatarUrl,
        lastLogin: candidate.lastLogin,
      },
    };
  }
}

module.exports = GetCandidateByIdUseCase;