const CandidateProfileModel = require('../models/CandidateProfile');
const ICandidateRepository = require('../../application/profile/repositories/ICandidateRepository');
const CandidateProfileMapper = require('../mappers/CandidateProfileMapper');

/**
 * CandidateRepository
 * Infrastructure layer implementation of ICandidateRepository
 * Uses CandidateProfileMapper to convert between domain entities and Mongoose documents
 */
class CandidateRepository extends ICandidateRepository {
  async findById(id) {
    const candidateDoc = await CandidateProfileModel.findById(id).populate(
      'userId',
      'avatarUrl avatar googleProfile'
    );
    return candidateDoc ? CandidateProfileMapper.toDomain(candidateDoc) : null;
  }

  async findByUserId(userId) {
    const candidateDoc = await CandidateProfileModel.findOne({
      userId,
    }).populate('userId', 'avatarUrl avatar googleProfile');
    return candidateDoc ? CandidateProfileMapper.toDomain(candidateDoc) : null;
  }

  async findByEmail(email) {
    const candidateDoc = await CandidateProfileModel.findOne({
      'personalInfo.email': email,
    }).populate('userId', 'avatarUrl avatar googleProfile');
    return candidateDoc ? CandidateProfileMapper.toDomain(candidateDoc) : null;
  }

  async findAll() {
    const candidateDocs = await CandidateProfileModel.find();
    return CandidateProfileMapper.toDomainArray(candidateDocs);
  }

  async create(candidateEntity) {
    const candidateData = CandidateProfileMapper.toMongoose(candidateEntity);
    const candidate = new CandidateProfileModel(candidateData);
    const savedDoc = await candidate.save();
    return CandidateProfileMapper.toDomain(savedDoc);
  }

  async update(id, candidateEntity) {
    const candidateData = CandidateProfileMapper.toMongoose(candidateEntity);
    const updatedDoc = await CandidateProfileModel.findByIdAndUpdate(
      id,
      candidateData,
      {
        new: true,
      }
    );
    return updatedDoc ? CandidateProfileMapper.toDomain(updatedDoc) : null;
  }

  async delete(id) {
    const deletedDoc = await CandidateProfileModel.findByIdAndDelete(id);
    return deletedDoc ? CandidateProfileMapper.toDomain(deletedDoc) : null;
  }

  async findBySkills(skillNames) {
    const candidateDocs = await CandidateProfileModel.find({
      'skills.name': { $in: skillNames },
    });
    return CandidateProfileMapper.toDomainArray(candidateDocs);
  }

  async search(query, filters = {}) {
    const searchQuery = { ...filters };

    if (query) {
      searchQuery.$or = [
        { 'personalInfo.fullName': new RegExp(query, 'i') },
        { 'personalInfo.phone': new RegExp(query, 'i') },
        { 'professionalInfo.headline': new RegExp(query, 'i') },
        { 'professionalInfo.bio': new RegExp(query, 'i') },
      ];
    }

    const candidateDocs = await CandidateProfileModel.find(searchQuery);
    return CandidateProfileMapper.toDomainArray(candidateDocs);
  }

  async findByIds(ids) {
    const candidateDocs = await CandidateProfileModel.find({
      _id: { $in: ids },
    });
    return CandidateProfileMapper.toDomainArray(candidateDocs);
  }

  async findByExperienceLevel(minYears, maxYears = null) {
    // This is a complex query - we'll need to aggregate experience
    // For now, return all and filter in use-case layer
    const candidateDocs = await CandidateProfileModel.find();
    const candidates = CandidateProfileMapper.toDomainArray(candidateDocs);

    return candidates.filter(candidate => {
      const years = candidate.getYearsOfExperience();
      if (maxYears !== null) {
        return years >= minYears && years <= maxYears;
      }
      return years >= minYears;
    });
  }

  async findByLocation(location) {
    const candidateDocs = await CandidateProfileModel.find({
      $or: [
        { 'personalInfo.address.city': new RegExp(location, 'i') },
        { 'personalInfo.address.country': new RegExp(location, 'i') },
      ],
    });
    return CandidateProfileMapper.toDomainArray(candidateDocs);
  }
}

module.exports = CandidateRepository;
