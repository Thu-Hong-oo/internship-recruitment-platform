const CompanyModel = require('../models/Company');
const ICompanyRepository = require('../../domain/supporting/repositories/ICompanyRepository');
const CompanyMapper = require('../mappers/CompanyMapper');

/**
 * CompanyRepository
 * Infrastructure layer implementation of ICompanyRepository
 * Converts between Domain Entities and Mongoose Models
 */
class CompanyRepository extends ICompanyRepository {
  async findById(id) {
    const doc = await CompanyModel.findById(id)
      .populate('owner', 'name email')
      .select('+logo +coverImage +verification');
    return CompanyMapper.toDomain(doc);
  }

  async findByName(name) {
    const doc = await CompanyModel.findOne({ name: new RegExp(name, 'i') });
    return CompanyMapper.toDomain(doc);
  }

  async findByTaxCode(taxCode) {
    const doc = await CompanyModel.findOne({ 'businessInfo.taxId': taxCode });
    return CompanyMapper.toDomain(doc);
  }

  async findByOwner(ownerId) {
    const doc = await CompanyModel.findOne({ owner: ownerId });
    return CompanyMapper.toDomain(doc);
  }

  async findAll() {
    const docs = await CompanyModel.find();
    return docs.map(doc => CompanyMapper.toDomain(doc));
  }

  async create(companyData) {
    // companyData can be either Domain Entity or plain object
    const mongooseData =
      companyData.constructor.name === 'Company'
        ? CompanyMapper.toMongoose(companyData)
        : companyData;

    const doc = new CompanyModel(mongooseData);
    await doc.save();
    return CompanyMapper.toDomain(doc);
  }

  async update(id, companyData) {
    const doc = await CompanyModel.findByIdAndUpdate(id, companyData, {
      new: true,
      runValidators: true,
    });
    return CompanyMapper.toDomain(doc);
  }

  async save(companyEntity) {
    // Save domain entity (update existing or create new)
    if (companyEntity.companyId) {
      // Update existing - convert entity to plain object and update
      const updateData = CompanyMapper.toMongoose(companyEntity);
      const doc = await CompanyModel.findByIdAndUpdate(
        companyEntity.companyId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!doc) throw new Error('Company not found');
      return CompanyMapper.toDomain(doc);
    } else {
      // Create new
      return await this.create(companyEntity);
    }
  }

  async delete(id) {
    const doc = await CompanyModel.findByIdAndDelete(id);
    return CompanyMapper.toDomain(doc);
  }

  async findByEmployer(employerId) {
    const docs = await CompanyModel.find({ owner: employerId });
    return docs.map(doc => CompanyMapper.toDomain(doc));
  }

  async search(query, limit = 10) {
    const docs = await CompanyModel.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { industry: new RegExp(query, 'i') },
      ],
    }).limit(limit);
    return docs.map(doc => CompanyMapper.toDomain(doc));
  }

  async findByIds(ids) {
    const docs = await CompanyModel.find({ _id: { $in: ids } });
    return docs.map(doc => CompanyMapper.toDomain(doc));
  }

  async findByOwner(ownerId) {
    const doc = await CompanyModel.findOne({ owner: ownerId }).populate(
      'owner',
      'name email'
    );
    return CompanyMapper.toDomain(doc);
  }

  async getMembers(companyId) {
    const EmployerProfile = require('../models/EmployerProfile');
    return await EmployerProfile.find({ company: companyId })
      .populate('owner', 'name email')
      .sort({ role: 1, createdAt: 1 });
  }

  async getMemberCount(companyId) {
    const EmployerProfile = require('../models/EmployerProfile');
    return await EmployerProfile.countDocuments({ company: companyId });
  }
}

module.exports = CompanyRepository;
