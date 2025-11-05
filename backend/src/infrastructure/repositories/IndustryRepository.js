const Industry = require('../models/Industry');
const IIndustryRepository = require('../../domain/master-data/repositories/IIndustryRepository');

/**
 * IndustryRepository
 * Infrastructure layer implementation of IIndustryRepository
 */
class IndustryRepository extends IIndustryRepository {
  async findById(id) {
    return await Industry.findById(id);
  }

  async findByName(name) {
    return await Industry.findOne({ name: new RegExp(name, 'i') });
  }

  async findByParent(parentId) {
    return await Industry.find({ parent: parentId });
  }

  async findAll() {
    return await Industry.find();
  }

  async create(industryData) {
    const industry = new Industry(industryData);
    return await industry.save();
  }

  async update(id, industryData) {
    return await Industry.findByIdAndUpdate(id, industryData, { new: true });
  }

  async delete(id) {
    return await Industry.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await Industry.find({ _id: { $in: ids } });
  }

  async search(query, limit = 10) {
    return await Industry.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
      ],
    }).limit(limit);
  }
}

module.exports = IndustryRepository;
