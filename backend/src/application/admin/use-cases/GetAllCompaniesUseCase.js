const { BadRequestError, NotFoundError } = require('../../../shared/utils/errors');

class GetAllCompaniesUseCase {
  constructor(companyRepository, employerRepository) {
    this.companyRepository = companyRepository;
    this.employerRepository = employerRepository;
  }

  async execute({ page = 1, limit = 20, status, verified, search }) {
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (verified !== undefined) filter.isVerified = verified === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { taxCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Get companies with pagination
    const companies = await this.companyRepository.findMany(filter, {
      skip,
      limit,
      sort: { createdAt: -1 }
    });

    const total = await this.companyRepository.count(filter);

    // Get employer info for each company
    const companiesWithEmployers = await Promise.all(
      companies.map(async (company) => {
        const employer = await this.employerRepository.findByCompanyId(company._id);
        return {
          ...company.toObject(),
          employer: employer ? {
            id: employer._id,
            fullName: employer.fullName,
            email: employer.email,
            phone: employer.phone
          } : null
        };
      })
    );

    return {
      companies: companiesWithEmployers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = GetAllCompaniesUseCase;