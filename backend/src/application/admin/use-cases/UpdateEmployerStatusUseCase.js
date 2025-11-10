const IAdminRepository = require('../repositories/IAdminRepository');

/**
 * UpdateEmployerStatusUseCase
 * Application layer use case for updating employer status
 */
class UpdateEmployerStatusUseCase {
  constructor(adminRepository) {
    if (!(adminRepository instanceof IAdminRepository)) {
      throw new Error('adminRepository must implement IAdminRepository');
    }
    this.adminRepository = adminRepository;
  }

  async execute(employerId, statusData) {
    if (!employerId) {
      throw new Error('Employer ID is required');
    }

    if (!statusData || !statusData.status) {
      throw new Error('Status is required');
    }

    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    if (!validStatuses.includes(statusData.status)) {
      throw new Error(
        'Invalid status. Must be one of: ' + validStatuses.join(', ')
      );
    }

    const employer = await this.adminRepository.getEmployerById(employerId);
    if (!employer) {
      throw new Error('Employer not found');
    }

    const updatedEmployer = await this.adminRepository.updateEmployerStatus(employerId, {
      status: statusData.status,
      updatedAt: new Date(),
    });

    return {
      message: 'Employer status updated successfully',
      employer: {
        id: updatedEmployer._id,
        email: updatedEmployer.email,
        fullName: updatedEmployer.fullName,
        role: updatedEmployer.role,
        status: updatedEmployer.status,
        updatedAt: updatedEmployer.updatedAt,
      },
    };
  }
}

module.exports = UpdateEmployerStatusUseCase;