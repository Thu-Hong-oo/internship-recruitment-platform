const User = require('../models/User');
const { AppError } = require('../utils/errors');

/**
 * Middleware to check if user profile is active (not soft deleted)
 */
const checkActiveProfile = async (req, res, next) => {
  try {
    // Check if user is active
    const user = await User.findById(req.user.id);
    if (!user || user.status === 'inactive' || user.deletedAt) {
      throw new AppError('Profile has been deactivated', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkActiveProfile;
