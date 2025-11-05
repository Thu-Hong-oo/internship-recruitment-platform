const UserModel = require('../models/User');
const IUserRepository = require('../../application/identity/repositories/IUserRepository');
const UserMapper = require('../mappers/UserMapper');

/**
 * UserRepository
 * Infrastructure layer implementation of IUserRepository
 * Uses UserMapper to convert between domain entities and Mongoose documents
 */
class UserRepository extends IUserRepository {
  async findById(id) {
    const userDoc = await UserModel.findById(id);
    return userDoc ? UserMapper.toDomain(userDoc) : null;
  }

  async findByEmail(email) {
    const userDoc = await UserModel.findOne({ email: email.toLowerCase() });
    return userDoc ? UserMapper.toDomain(userDoc) : null;
  }

  async findByUsername(username) {
    const userDoc = await UserModel.findOne({ username });
    return userDoc ? UserMapper.toDomain(userDoc) : null;
  }

  async findAll() {
    const userDocs = await UserModel.find();
    return UserMapper.toDomainArray(userDocs);
  }

  async create(userEntity) {
    const userData = UserMapper.toMongoose(userEntity);
    const user = new UserModel(userData);
    const savedDoc = await user.save();
    return UserMapper.toDomain(savedDoc);
  }

  async update(id, userEntity) {
    const userData = UserMapper.toMongoose(userEntity);
    const updatedDoc = await UserModel.findByIdAndUpdate(id, userData, {
      new: true,
    });
    return updatedDoc ? UserMapper.toDomain(updatedDoc) : null;
  }

  async delete(id) {
    const deletedDoc = await UserModel.findByIdAndDelete(id);
    return deletedDoc ? UserMapper.toDomain(deletedDoc) : null;
  }

  async findByRole(role) {
    const userDocs = await UserModel.find({ role });
    return UserMapper.toDomainArray(userDocs);
  }

  async findByStatus(status) {
    const userDocs = await UserModel.find({ status });
    return UserMapper.toDomainArray(userDocs);
  }

  async updateLastLogin(id) {
    const updatedDoc = await UserModel.findByIdAndUpdate(
      id,
      { lastLogin: new Date() },
      { new: true }
    );
    return updatedDoc ? UserMapper.toDomain(updatedDoc) : null;
  }

  async findByIds(ids) {
    const userDocs = await UserModel.find({ _id: { $in: ids } });
    return UserMapper.toDomainArray(userDocs);
  }

  async search(query, limit = 10) {
    const userDocs = await UserModel.find({
      $or: [
        { email: new RegExp(query, 'i') },
        { fullName: new RegExp(query, 'i') },
      ],
    }).limit(limit);
    return UserMapper.toDomainArray(userDocs);
  }

  async updatePassword(id, hashedPassword) {
    const updatedDoc = await UserModel.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
    return updatedDoc ? UserMapper.toDomain(updatedDoc) : null;
  }

  async findByGoogleId(googleId) {
    const userDoc = await UserModel.findOne({
      'googleProfile.googleId': googleId,
    });
    return userDoc ? UserMapper.toDomain(userDoc) : null;
  }

  async verifyEmail(id) {
    const updatedDoc = await UserModel.findByIdAndUpdate(
      id,
      { isEmailVerified: true },
      { new: true }
    );
    return updatedDoc ? UserMapper.toDomain(updatedDoc) : null;
  }
}

module.exports = UserRepository;
