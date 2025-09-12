// Models
const User = require('../models/User');
const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');
const Application = require('../models/Application');
const SkillRoadmap = require('../models/SkillRoadmap');
const AIAnalysis = require('../models/AIAnalysis');
const Notification = require('../models/Notification');

const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');
const { uploadImage } = require('../services/imageUploadService');
const { getAvatarUrl } = require('../utils/avatarUtils');
const { getIO } = require('../config/socket');
const googleAuthService = require('../services/googleAuth');

// Resolve display name consistently
const resolveFullName = user => {
  if (user?.fullName && user.fullName.trim().length > 0) return user.fullName;
  if (user?.displayFullName && String(user.displayFullName).trim().length > 0)
    return String(user.displayFullName).trim();
  if (user?.email) return user.email.split('@')[0];
  return 'User';
};

// Base user response utility
const baseUserResponse = user => ({
  id: user._id,
  email: user.email,
  fullName: resolveFullName(user),
  role: user.role,
  authMethod: user.authMethod,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  avatar: getAvatarUrl(user),
  googleProfile: user.googleProfile,
  preferences: user.preferences,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  candidateProfile: user.candidateProfile,
  employerProfile: user.employerProfile,
});

// Public user response utility (for search and public viewing)
const getPublicUserData = user => ({
  id: user._id,
  fullName: user.fullName,
  role: user.role,
  avatar: getAvatarUrl(user),
  isActive: user.isActive,
  createdAt: user.createdAt,
  // Add role-specific public data
  ...(user.role === 'candidate' && {
    candidateProfile: user.candidateProfile,
  }),
  ...(user.role === 'employer' && {
    employerProfile: user.employerProfile,
  }),
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  res.status(200).json({
    success: true,
    data: baseUserResponse(user),
  });
});

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng chọn file hình ảnh để upload',
    });
  }

  try {
    // Upload via core service to standardize response
    const result = await uploadImage('avatar', req.file.buffer);

    // Update user avatar in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.publicId }, // Lưu publicId thay vì URL
      { new: true }
    );

    logger.info(`Avatar uploaded for user: ${user.email}`, {
      userId: user._id,
      publicId: result.publicId,
      url: result.url,
    });

    res.status(200).json({
      success: true,
      message: 'Upload avatar thành công',
      data: {
        avatar: {
          publicId: result.publicId,
          url: result.url,
          size: result.bytes,
          format: result.format,
          dimensions: { width: result.width, height: result.height },
        },
        user: baseUserResponse(user),
      },
    });
  } catch (error) {
    logger.error('Failed to update avatar in database', {
      error: error.message,
      userId: req.user.id,
    });

    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật avatar trong database',
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user.id);

  // Basic profile fields
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    email: req.body.email,
  };

  // Role-specific profile updates
  if (user.role === 'candidate') {
    await CandidateProfile.findOneAndUpdate(
      { userId: user._id },
      {
        'education.university': req.body.university,
        'education.major': req.body.major,
        'education.graduationYear': req.body.graduationYear,
        'preferences.locations': req.body.preferredLocations,
        'preferences.internshipTypes': req.body.preferredTypes,
      },
      { new: true }
    );
  } else if (user.role === 'employer') {
    await EmployerProfile.findOneAndUpdate(
      { userId: user._id },
      {
        'company.name': req.body.companyName,
        'company.industry': req.body.industry,
        'position.title': req.body.jobTitle,
        'contact.workEmail': req.body.workEmail,
      },
      { new: true }
    );
  }

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(
    key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  logger.info(`User profile updated: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    data: baseUserResponse(user),
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
      error: 'Mật khẩu hiện tại không chính xác',
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`, { userId: user._id });

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
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
      error: 'Google ID token là bắt buộc',
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng',
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản đã được liên kết với Google',
      });
    }

    // Verify Google ID token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({
      googleId: googleUser.googleId,
    });
    if (existingGoogleUser) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản Google này đã được liên kết với người dùng khác',
      });
    }

    // Link Google account
    user.googleId = googleUser.googleId;
    user.googleEmail = googleUser.email;
    user.googleProfile = {
      picture: googleUser.picture,
      locale: googleUser.locale,
      verified_email: googleUser.verified_email,
    };
    user.authMethod = 'hybrid'; // User can now use both methods
    user.isEmailVerified = true;

    await user.save();

    logger.info(`Google account linked to user: ${user.email}`, {
      userId: user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Liên kết tài khoản Google thành công',
      user: baseUserResponse(user),
    });
  } catch (error) {
    logger.error('Failed to link Google account', {
      error: error.message,
      userId,
    });

    res.status(400).json({
      success: false,
      error: error.message || 'Không thể liên kết tài khoản Google',
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
        error: 'Không tìm thấy người dùng',
      });
    }

    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        error:
          'Không thể hủy liên kết Google nếu đó là phương thức xác thực duy nhất',
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        error: 'Không có tài khoản Google nào được liên kết',
      });
    }

    // Unlink Google account
    user.googleId = undefined;
    user.googleEmail = undefined;
    user.googleProfile = undefined;
    user.authMethod = 'local';

    await user.save();

    logger.info(`Google account unlinked from user: ${user.email}`, {
      userId: user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Hủy liên kết tài khoản Google thành công',
      user: baseUserResponse(user),
    });
  } catch (error) {
    logger.error('Failed to unlink Google account', {
      error: error.message,
      userId,
    });

    res.status(400).json({
      success: false,
      error: error.message || 'Không thể hủy liên kết tài khoản Google',
    });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  let profileData = {};
  if (user.role === 'candidate') {
    let candidate = await CandidateProfile.findOne({ userId: user._id });
    if (!candidate) {
      candidate = await CandidateProfile.create({ userId: user._id });
    }
    profileData = {
      education: candidate.education,
      skills: candidate.skills,
      preferences: candidate.preferences,
      resume: candidate.resume,
    };
  } else if (user.role === 'employer') {
    let employerProfile = await EmployerProfile.findOne({ userId: user._id });
    if (!employerProfile) {
      employerProfile = await EmployerProfile.create({ userId: user._id });
    }
    profileData = {
      company: employerProfile.company,
      position: employerProfile.position,
      contact: employerProfile.contact,
    };
  }

  res.status(200).json({
    success: true,
    data: {
      user: baseUserResponse(user),
      profile: profileData,
    },
  });
});

// @desc    Get public user profile (for employers to view candidates)
// @route   GET /api/users/:id/public-profile
// @access  Private (Employer only)
const getPublicUserProfile = asyncHandler(async (req, res) => {
  // Only employers can view public profiles
  if (req.user.role !== 'employer') {
    return res.status(403).json({
      success: false,
      error: 'Chỉ nhà tuyển dụng mới có quyền xem thông tin ứng viên',
    });
  }

  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  // Only show public information
  const publicUserData = getPublicUserData(user);

  res.status(200).json({
    success: true,
    data: publicUserData,
  });
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = asyncHandler(async (req, res) => {
  const { q, role, location, skills, page = 1, limit = 10 } = req.query;

  const query = { isActive: true };

  // Search by name or email
  if (q) {
    query.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  // Filter by location
  if (location) {
    query['profile.location.city'] = { $regex: location, $options: 'i' };
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const users = await User.find(query)
    .select('-password')
    .limit(limit)
    .skip(startIndex)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  const pagination = {
    current: page,
    pages: Math.ceil(total / limit),
    total,
    hasNext: endIndex < total,
    hasPrev: page > 1,
  };

  res.status(200).json({
    success: true,
    data: users.map(user => getPublicUserData(user)),
    pagination,
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  let stats = {
    profileCompletion: 0,
    lastActive: user?.lastActive || user?.createdAt,
  };

  if (user.role === 'candidate') {
    // Intern stats
    const internProfile = await CandidateProfile.findOne({ userId });
    const applications = await Application.find({
      internId: internProfile._id,
    });
    const currentRoadmap = await SkillRoadmap.findOne({
      internId: internProfile._id,
      status: 'in_progress',
    });

    stats = {
      ...stats,
      applications: {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        interviewing: applications.filter(app => app.status === 'interview')
          .length,
        accepted: applications.filter(app => app.status === 'accepted').length,
      },
      skills: {
        verified: internProfile.skills.technical.filter(s => s.verified).length,
        total: internProfile.skills.technical.length,
      },
      roadmap: currentRoadmap
        ? {
            progress: currentRoadmap.progress.overallProgress,
            completedMilestones: currentRoadmap.progress.completedMilestones,
            totalMilestones: currentRoadmap.progress.totalMilestones,
          }
        : null,
    };
  } else if (user.role === 'employer') {
    // Employer stats
    const employerProfile = await EmployerProfile.findOne({ userId });
    const totalApplications = await Application.countDocuments({
      'job.employer': employerProfile._id,
    });

    stats = {
      ...stats,
      jobPostings: {
        active: await Job.countDocuments({
          employer: employerProfile._id,
          status: 'active',
        }),
        total: await Job.countDocuments({ employer: employerProfile._id }),
      },
      applications: {
        total: totalApplications,
        pending: await Application.countDocuments({
          'job.employer': employerProfile._id,
          status: 'pending',
        }),
        interviewing: await Application.countDocuments({
          'job.employer': employerProfile._id,
          status: 'interview',
        }),
      },
    };
  }

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  const { notifications, privacy, language, timezone } = req.body;

  const preferences = {
    notifications: notifications || {},
    privacy: privacy || {},
    language: language || 'vi',
    timezone: timezone || 'Asia/Ho_Chi_Minh',
  };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { preferences },
    { new: true, runValidators: true }
  );

  logger.info(`User preferences updated: ${user.email}`, { userId: user._id });

  res.status(200).json({
    success: true,
    data: user.preferences,
  });
});

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const query = { user: req.user.id };

  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);

  const total = await Notification.countDocuments(query);

  const pagination = {
    current: parseInt(page),
    pages: Math.ceil(total / limit),
    total,
    hasNext: endIndex < total,
    hasPrev: page > 1,
  };

  res.status(200).json({
    success: true,
    data: notifications,
    pagination,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    {
      isRead: true,
      readAt: new Date(),
    },
    { new: true }
  );

  // Emit socket event to update UI in real-time
  const io = getIO();
  io.to(req.user.id.toString()).emit('notification_read', {
    notificationId: notification._id,
    readAt: notification.readAt,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy thông báo',
    });
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'Đã đánh dấu tất cả thông báo là đã đọc',
  });
});

// @desc    Delete notification
// @route   DELETE /api/users/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy thông báo',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Đã xóa thông báo',
  });
});

// @desc    Deactivate account
// @route   PUT /api/users/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      isActive: false,
      deactivatedAt: new Date(),
      deactivationReason: reason,
    },
    { new: true }
  );

  logger.info(`User account deactivated: ${user.email}`, {
    userId: user._id,
    reason,
  });

  res.status(200).json({
    success: true,
    message: 'Tài khoản đã được tạm ngưng',
  });
});

// @desc    Reactivate account
// @route   PUT /api/users/reactivate
// @access  Private
const reactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      isActive: true,
      $unset: { deactivatedAt: 1, deactivationReason: 1 },
    },
    { new: true }
  );

  logger.info(`User account reactivated: ${user.email}`, {
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    message: 'Tài khoản đã được kích hoạt lại',
  });
});

module.exports = {
  getUser,
  uploadAvatar,
  updateProfile,
  changePassword,
  linkGoogleAccount,
  unlinkGoogleAccount,
  getUserProfile,
  getPublicUserProfile,
  searchUsers,
  getUserStats,
  updateUserPreferences,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deactivateAccount,
  reactivateAccount,
};
