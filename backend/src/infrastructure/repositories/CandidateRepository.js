const CandidateProfile = require('../models/CandidateProfile');
const ICandidateRepository = require('../../application/profile/repositories/ICandidateRepository');

/**
 * CandidateRepository
 * Infrastructure layer implementation of ICandidateRepository
 */
class CandidateRepository extends ICandidateRepository {
  async findById(id) {
    return await CandidateProfile.findById(id);
  }

  async findByUserId(userId) {
    return await CandidateProfile.findOne({ userId });
  }

  async findByEmail(email) {
    return await CandidateProfile.findOne({ 'contactInfo.email': email });
  }

  async findAll() {
    return await CandidateProfile.find();
  }

  async create(candidateData) {
    const candidate = new CandidateProfile(candidateData);
    return await candidate.save();
  }

  async update(id, candidateData) {
    return await CandidateProfile.findByIdAndUpdate(id, candidateData, {
      new: true,
    });
  }

  async delete(id) {
    return await CandidateProfile.findByIdAndDelete(id);
  }

  async findBySkills(skillIds) {
    return await CandidateProfile.find({
      'skills.skill': { $in: skillIds },
    });
  }

  async search(query, filters = {}) {
    const searchQuery = { ...filters };

    if (query) {
      searchQuery.$or = [
        { 'personalInfo.firstName': new RegExp(query, 'i') },
        { 'personalInfo.lastName': new RegExp(query, 'i') },
        { 'contactInfo.email': new RegExp(query, 'i') },
        { 'professionalInfo.title': new RegExp(query, 'i') },
        { 'professionalInfo.summary': new RegExp(query, 'i') },
      ];
    }

    return await CandidateProfile.find(searchQuery);
  }

  async findByIds(ids) {
    return await CandidateProfile.find({ _id: { $in: ids } });
  }

  async findByExperienceLevel(level) {
    return await CandidateProfile.find({
      'professionalInfo.experienceLevel': level,
    });
  }

  async findByLocation(location) {
    return await CandidateProfile.find({
      $or: [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') },
      ],
    });
  }
}

module.exports = CandidateRepository;
