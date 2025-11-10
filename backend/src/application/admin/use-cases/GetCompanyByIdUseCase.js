class GetCompanyByIdUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }

  async execute(companyId) {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const company = await this.companyRepository.findById(companyId);

    if (!company) {
      throw new Error('Company not found');
    }

    return company;
  }
}

module.exports = GetCompanyByIdUseCase;