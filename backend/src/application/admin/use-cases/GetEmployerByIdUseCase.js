const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * GetEmployerByIdUseCase
 * Application layer use case for getting an employer by ID
 */
class GetEmployerByIdUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(employerId) {
    if (!employerId) {
      throw new Error('Employer ID is required');
    }

    const employer = await this.adminRepository.getEmployerById(employerId);

    if (!employer) {
      throw new Error('Employer not found');
    }

    return {
      employer: {
        id: employer._id,
        email: employer.email,
        fullName: employer.fullName,
        role: employer.role,
        status: employer.status,
        createdAt: employer.createdAt,
        updatedAt: employer.updatedAt,
        profile: employer.profile,
        company: employer.company,
      },
    };
  }
}

module.exports = GetEmployerByIdUseCase;