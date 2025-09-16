const User = require('../../models/User');
const Application = require('../../models/Application');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../utils/logger');

// ========================================
// USER MANAGEMENT
// ========================================

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const filter = {};

  // Exclude admin users by default (security), unless explicitly requested
  if (req.query.includeAdmin !== 'true') {
    filter.role = { $ne: 'admin' };
  }

  // Filter by role - override if specified
  if (req.query.role) {
    // Only allow filtering specific roles
    if (['candidate', 'employer', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
  }

  // Filter by status - using new status field only
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by email verification
  if (req.query.emailVerified) {
    filter.isEmailVerified = req.query.emailVerified === 'true';
  }

  // Search by email or name
  if (req.query.search) {
    filter.$or = [
      { email: { $regex: req.query.search, $options: 'i' } },
      { fullName: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select(
      'email fullName role isEmailVerified status statusReason statusChangedAt avatar createdAt lastLogin preferences.language preferences.timezone preferences.notifications.emailNotifications employerProfile'
    )
    .populate({
      path: 'employerProfile',
      select: 'company.name company.industry verification.isVerified',
      model: 'EmployerProfile',
    })
    .populate({
      path: 'statusChangedBy',
      select: 'fullName email',
      model: 'User',
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);

  // Pagination
  const endIndex = startIndex + limit;
  const totalPages = Math.ceil(total / limit) || 1;
  const pagination = {
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  const data = users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    fullName: u.fullName,
    avatar: u.avatar,
    status: u.status,
    statusDisplay: u.statusDisplay,
    statusReason: u.statusReason,
    statusChangedAt: u.statusChangedAt,
    statusChangedBy: u.statusChangedBy
      ? {
          id: u.statusChangedBy._id,
          fullName: u.statusChangedBy.fullName,
          email: u.statusChangedBy.email,
        }
      : null,
    isEmailVerified: u.isEmailVerified,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
    preferences: {
      language: u.preferences?.language,
      timezone: u.preferences?.timezone,
      notifications: {
        emailNotifications: u.preferences?.notifications?.emailNotifications,
      },
    },
    company:
      u.role === 'employer' && u.employerProfile
        ? {
            name: u.employerProfile.company?.name,
            industry: u.employerProfile.company?.industry,
            isVerified: u.employerProfile.verification?.isVerified,
          }
        : undefined,
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    pagination,
    data,
  });
});

// @desc    Get single user (admin only)
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -resetPasswordToken -resetPasswordExpire')
    .populate('candidateProfile')
    .populate('employerProfile');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Create user (admin only)
// @route   POST /api/admin/users
// @access  Private (Admin only)
const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  logger.info(`Admin created user: ${user.email}`, {
    adminId: req.user.id,
    userId: user._id,
  });

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  logger.info(`Admin updated user: ${user.email}`, {
    adminId: req.user.id,
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});


// @desc    Update user status (admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const { USER_STATUS } = require('../../constants/common.constants');

  if (!Object.values(USER_STATUS).includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Trạng thái không hợp lệ',
      validStatuses: Object.values(USER_STATUS),
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng',
    });
  }

  // Sử dụng method để cập nhật status
  user.updateStatus(status, reason, req.user.id);
  await user.save();

  logger.info(`Admin updated user status: ${user.email} -> ${status}`, {
    adminId: req.user.id,
    userId: user._id,
    reason: reason,
    previousStatus: user.status,
  });

  res.status(200).json({
    success: true,
    message: 'Cập nhật trạng thái thành công',
    data: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      statusDisplay: user.statusDisplay,
      statusReason: user.statusReason,
      statusChangedAt: user.statusChangedAt,
    },
  });
});

// @desc    Update user role (admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ success: false, error: 'Thiếu role' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res
      .status(404)
      .json({ success: false, error: 'Không tìm thấy người dùng' });
  }

  logger.info(`Admin updated user role: ${user.email} -> ${role}`, {
    adminId: req.user.id,
    userId: user._id,
  });

  res.status(200).json({ success: true, data: user });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
};
