const User = require('../../../infrastructure/models/User');

class GetMeUseCase {
  async execute({ userId }) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const user = await User.findById(userId)
        .select('-password')
        .populate('candidateProfile')
        .populate('employerProfile');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('GetMeUseCase Error:', error);
      throw error;
    }
  }
}

module.exports = GetMeUseCase;
