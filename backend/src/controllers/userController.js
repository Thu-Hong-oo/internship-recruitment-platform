const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');
const googleAuthService = require('../services/googleAuth');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng'
    });
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload user avatar
// @route   POST /api/users/upload-avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng chọn file hình ảnh để upload'
    });
  }

  try {
    // Get Cloudinary URL from uploaded file
    const avatarUrl = req.file.path; // Cloudinary returns the URL in req.file.path
    
    // Update user avatar in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );
    
    logger.info(`Avatar uploaded to Cloudinary for user: ${user.email}`, { 
      userId: user._id,
      avatarUrl: avatarUrl 
    });

    res.status(200).json({
      success: true,
      message: 'Upload avatar thành công',
      avatar: avatarUrl,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        authMethod: user.authMethod
      }
    });
  } catch (error) {
    logger.error('Failed to update avatar in database', { 
      error: error.message, 
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật avatar trong database'
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    dateOfBirth: req.body.dateOfBirth,
    gender: req.body.gender,
    address: req.body.address,
    education: req.body.education
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  logger.info(`User profile updated: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      error: 'Mật khẩu hiện tại không chính xác'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`, { userId: user._id });

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token
  });
});

// @desc    Link Google account to existing account
// @route   POST /api/users/link-google
// @access  Private
const linkGoogleAccount = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const userId = req.user.id;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: 'Google ID token là bắt buộc'
    });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản đã được liên kết với Google'
      });
    }

    // Verify Google ID token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ googleId: googleUser.googleId });
    if (existingGoogleUser) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản Google này đã được liên kết với người dùng khác'
      });
    }

    // Link Google account
    user.googleId = googleUser.googleId;
    user.googleEmail = googleUser.email;
    user.googleProfile = {
      picture: googleUser.picture,
      locale: googleUser.locale,
      verified_email: googleUser.verified_email
    };
    user.authMethod = 'hybrid'; // User can now use both methods
    user.isEmailVerified = true;

    await user.save();

    logger.info(`Google account linked to user: ${user.email}`, { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Liên kết tài khoản Google thành công',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar || user.googleProfile?.picture,
        isEmailVerified: user.isEmailVerified,
        authMethod: user.authMethod
      }
    });
  } catch (error) {
    logger.error('Failed to link Google account', { error: error.message, userId });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Không thể liên kết tài khoản Google'
    });
  }
});

// @desc    Unlink Google account
// @route   DELETE /api/users/unlink-google
// @access  Private
const unlinkGoogleAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Không thể hủy liên kết Google nếu đó là phương thức xác thực duy nhất'
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        error: 'Không có tài khoản Google nào được liên kết'
      });
    }

    // Unlink Google account
    user.googleId = undefined;
    user.googleEmail = undefined;
    user.googleProfile = undefined;
    user.authMethod = 'local';

    await user.save();

    logger.info(`Google account unlinked from user: ${user.email}`, { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Hủy liên kết tài khoản Google thành công',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        authMethod: user.authMethod
      }
    });
  } catch (error) {
    logger.error('Failed to unlink Google account', { error: error.message, userId });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Không thể hủy liên kết tài khoản Google'
    });
  }
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  getMe,
  updateProfile,
  changePassword,
  linkGoogleAccount,
  unlinkGoogleAccount
};
