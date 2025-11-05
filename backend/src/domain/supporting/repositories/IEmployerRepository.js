/**
 * IEmployerRepository Interface
 * Domain: Supporting
 * Repository interface for Employer entity
 */
class IEmployerRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(employerData) {
    throw new Error('Method not implemented');
  }

  async update(id, employerData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findByVerificationStatus(status) {
    throw new Error('Method not implemented');
  }

  async findByCompany(companyId) {
    throw new Error('Method not implemented');
  }

  async updateVerificationStatus(id, status, verifiedBy, notes) {
    throw new Error('Method not implemented');
  }
}

module.exports = IEmployerRepository;
