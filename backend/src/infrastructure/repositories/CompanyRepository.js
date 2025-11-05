const Company = require('../models/Company');
const ICompanyRepository = require('../../domain/supporting/repositories/ICompanyRepository');

/**
 * CompanyRepository
 * Infrastructure layer implementation of ICompanyRepository
 */
class CompanyRepository extends ICompanyRepository {
  async findById(id) {
    return await Company.findById(id);
  }

  async findByName(name) {
    return await Company.findOne({ name: new RegExp(name, 'i') });
  }

  async findByTaxCode(taxCode) {
    return await Company.findOne({ taxCode });
  }

  async findAll() {
    return await Company.find();
  }

  async create(companyData) {
    const company = new Company(companyData);
    return await company.save();
  }

  async update(id, companyData) {
    return await Company.findByIdAndUpdate(id, companyData, { new: true });
  }

  async delete(id) {
    return await Company.findByIdAndDelete(id);
  }

  async findByEmployer(employerId) {
    return await Company.find({ employerId });
  }

  async search(query, limit = 10) {
    return await Company.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { industry: new RegExp(query, 'i') },
      ],
    }).limit(limit);
  }

  async findByIds(ids) {
    return await Company.find({ _id: { $in: ids } });
  }
}

module.exports = CompanyRepository;
