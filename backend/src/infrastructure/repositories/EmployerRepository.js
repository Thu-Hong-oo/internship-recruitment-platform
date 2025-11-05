const EmployerProfileModel = require('../models/EmployerProfile');
const IEmployerRepository = require('../../application/profile/repositories/IEmployerRepository');
const EmployerProfileMapper = require('../mappers/EmployerProfileMapper');

/**
 * EmployerRepository
 * Infrastructure layer implementation of IEmployerRepository
 * Uses EmployerProfileMapper to convert between domain entities and Mongoose documents
 */
class EmployerRepository extends IEmployerRepository {
  async findById(id) {
    const employerDoc = await EmployerProfileModel.findById(id);
    return employerDoc ? EmployerProfileMapper.toDomain(employerDoc) : null;
  }

  async findByUserId(userId) {
    const employerDoc = await EmployerProfileModel.findOne({ userId });
    return employerDoc ? EmployerProfileMapper.toDomain(employerDoc) : null;
  }

  async findByEmail(email) {
    const employerDoc = await EmployerProfileModel.findOne({
      'contactInfo.email': email,
    });
    return employerDoc ? EmployerProfileMapper.toDomain(employerDoc) : null;
  }

  async findAll() {
    const employerDocs = await EmployerProfileModel.find();
    return employerDocs.map(doc => EmployerProfileMapper.toDomain(doc));
  }

  async create(employerEntity) {
    const employerData = EmployerProfileMapper.toMongoose(employerEntity);
    const employer = new EmployerProfileModel(employerData);
    const savedDoc = await employer.save();
    return EmployerProfileMapper.toDomain(savedDoc);
  }

  async update(id, employerEntity) {
    const employerData = EmployerProfileMapper.toMongoose(employerEntity);
    const updatedDoc = await EmployerProfileModel.findByIdAndUpdate(
      id,
      employerData,
      {
        new: true,
      }
    );
    return updatedDoc ? EmployerProfileMapper.toDomain(updatedDoc) : null;
  }

  async delete(id) {
    const deletedDoc = await EmployerProfileModel.findByIdAndDelete(id);
    return deletedDoc ? EmployerProfileMapper.toDomain(deletedDoc) : null;
  }

  async findByVerificationStatus(status) {
    const employerDocs = await EmployerProfileModel.find({
      verificationStatus: status,
    });
    return employerDocs.map(doc => EmployerProfileMapper.toDomain(doc));
  }

  async findByCompany(companyId) {
    const employerDocs = await EmployerProfileModel.find({ companyId });
    return employerDocs.map(doc => EmployerProfileMapper.toDomain(doc));
  }

  async updateVerificationStatus(id, status, verifiedBy, notes) {
    const updatedDoc = await EmployerProfileModel.findByIdAndUpdate(
      id,
      {
        verificationStatus: status,
        verifiedBy,
        verificationNotes: notes,
        verifiedAt: new Date(),
      },
      { new: true }
    );
    return updatedDoc ? EmployerProfileMapper.toDomain(updatedDoc) : null;
  }

  async findByIds(ids) {
    const employerDocs = await EmployerProfileModel.find({ _id: { $in: ids } });
    return employerDocs.map(doc => EmployerProfileMapper.toDomain(doc));
  }

  async findOne(query) {
    const employerDoc = await EmployerProfileModel.findOne(query).populate(
      'company'
    );
    return employerDoc ? EmployerProfileMapper.toDomain(employerDoc) : null;
  }

  async findByUserAndCompany(userId, companyId) {
    // Support both userId (ObjectId) and email (string)
    const User = require('../models/User');

    if (typeof userId === 'string' && userId.includes('@')) {
      // Email provided
      const user = await User.findOne({ email: userId.toLowerCase() });
      if (!user) return null;
      userId = user._id;
    }

    const employerDoc = await EmployerProfileModel.findOne({
      owner: userId,
      company: companyId,
    });
    return employerDoc ? EmployerProfileMapper.toDomain(employerDoc) : null;
  }
}

module.exports = EmployerRepository;
