const EmployerProfile = require('../models/EmployerProfile');
const IEmployerRepository = require('../../application/profile/repositories/IEmployerRepository');

/**
 * EmployerRepository
 * Infrastructure layer implementation of IEmployerRepository
 */
class EmployerRepository extends IEmployerRepository {
  async findById(id) {
    return await EmployerProfile.findById(id);
  }

  async findByUserId(userId) {
    return await EmployerProfile.findOne({ userId });
  }

  async findByEmail(email) {
    return await EmployerProfile.findOne({ 'contactInfo.email': email });
  }

  async findAll() {
    return await EmployerProfile.find();
  }

  async create(employerData) {
    const employer = new EmployerProfile(employerData);
    return await employer.save();
  }

  async update(id, employerData) {
    return await EmployerProfile.findByIdAndUpdate(id, employerData, {
      new: true,
    });
  }

  async delete(id) {
    return await EmployerProfile.findByIdAndDelete(id);
  }

  async findByVerificationStatus(status) {
    return await EmployerProfile.find({ verificationStatus: status });
  }

  async findByCompany(companyId) {
    return await EmployerProfile.find({ companyId });
  }

  async updateVerificationStatus(id, status, verifiedBy, notes) {
    return await EmployerProfile.findByIdAndUpdate(
      id,
      {
        verificationStatus: status,
        verifiedBy,
        verificationNotes: notes,
        verifiedAt: new Date(),
      },
      { new: true }
    );
  }

  async findByIds(ids) {
    return await EmployerProfile.find({ _id: { $in: ids } });
  }
}

module.exports = EmployerRepository;
