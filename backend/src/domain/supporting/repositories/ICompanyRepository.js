/**
 * ICompanyRepository Interface
 * Domain: Supporting
 * Repository interface for Company entity
 */
class ICompanyRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findByTaxCode(taxCode) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(companyData) {
    throw new Error('Method not implemented');
  }

  async update(id, companyData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findByEmployer(employerId) {
    throw new Error('Method not implemented');
  }

  async search(query, limit = 10) {
    throw new Error('Method not implemented');
  }
}

module.exports = ICompanyRepository;
