const IndustryModel = require('../models/Industry');
const IIndustryRepository = require('../../domain/master-data/repositories/IIndustryRepository');
const IndustryMapper = require('../mappers/IndustryMapper');

/**
 * IndustryRepository
 * Infrastructure layer implementation of IIndustryRepository
 * Uses IndustryMapper to convert between domain entities and Mongoose documents
 */
class IndustryRepository extends IIndustryRepository {
  async findById(id) {
    const industryDoc = await IndustryModel.findById(id);
    return industryDoc ? IndustryMapper.toDomain(industryDoc) : null;
  }

  async findByCode(code) {
    const industryDoc = await IndustryModel.findOne({ code });
    return industryDoc ? IndustryMapper.toDomain(industryDoc) : null;
  }

  async findByName(name, lang = 'vi') {
    const searchKey = `name.${lang}`;
    const industryDoc = await IndustryModel.findOne({
      [searchKey]: new RegExp(name, 'i'),
    });
    return industryDoc ? IndustryMapper.toDomain(industryDoc) : null;
  }

  async findByParentCode(parentCode) {
    const industryDocs = await IndustryModel.find({ parentCode });
    return IndustryMapper.toDomainArray(industryDocs);
  }

  async findAll() {
    const industryDocs = await IndustryModel.find();
    return IndustryMapper.toDomainArray(industryDocs);
  }

  async findVisible() {
    const industryDocs = await IndustryModel.find({ visible: true }).sort({
      sortOrder: 1,
    });
    return IndustryMapper.toDomainArray(industryDocs);
  }

  async findRootLevel() {
    const industryDocs = await IndustryModel.find({ parentCode: null }).sort({
      sortOrder: 1,
    });
    return IndustryMapper.toDomainArray(industryDocs);
  }

  async create(industryEntity) {
    const industryData = IndustryMapper.toMongoose(industryEntity);
    const industry = new IndustryModel(industryData);
    const savedDoc = await industry.save();
    return IndustryMapper.toDomain(savedDoc);
  }

  async update(id, industryEntity) {
    const industryData = IndustryMapper.toMongoose(industryEntity);
    const updatedDoc = await IndustryModel.findByIdAndUpdate(id, industryData, {
      new: true,
    });
    return updatedDoc ? IndustryMapper.toDomain(updatedDoc) : null;
  }

  async delete(id) {
    const deletedDoc = await IndustryModel.findByIdAndDelete(id);
    return deletedDoc ? IndustryMapper.toDomain(deletedDoc) : null;
  }

  async findByIds(ids) {
    const industryDocs = await IndustryModel.find({ _id: { $in: ids } });
    return IndustryMapper.toDomainArray(industryDocs);
  }

  async search(query, lang = 'vi', limit = 10) {
    const searchKey = `name.${lang}`;
    const industryDocs = await IndustryModel.find({
      [searchKey]: new RegExp(query, 'i'),
    }).limit(limit);
    return IndustryMapper.toDomainArray(industryDocs);
  }
}

module.exports = IndustryRepository;
