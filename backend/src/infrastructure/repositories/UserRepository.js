const User = require('../models/User');
const IUserRepository = require('../../application/identity/repositories/IUserRepository');

/**
 * UserRepository
 * Infrastructure layer implementation of IUserRepository
 */
class UserRepository extends IUserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username) {
    return await User.findOne({ username });
  }

  async findAll() {
    return await User.find();
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async update(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  async findByRole(role) {
    return await User.find({ role });
  }

  async findByStatus(status) {
    return await User.find({ status });
  }

  async updateLastLogin(id) {
    return await User.findByIdAndUpdate(
      id,
      { lastLogin: new Date() },
      { new: true }
    );
  }

  async findByIds(ids) {
    return await User.find({ _id: { $in: ids } });
  }

  async search(query, limit = 10) {
    return await User.find({
      $or: [
        { email: new RegExp(query, 'i') },
        { username: new RegExp(query, 'i') },
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') },
      ],
    }).limit(limit);
  }

  async updatePassword(id, hashedPassword) {
    return await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
  }
}

module.exports = UserRepository;
