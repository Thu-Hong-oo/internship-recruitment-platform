const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');

// @desc    Get system dashboard
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getSystemDashboard = asyncHandler(async (req, res) => {
  try {
    const result = await getSystemDashboardUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.dashboard,
    });
  } catch (error) {
    logger.error('Get system dashboard error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const result = await getAllUsersUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = asyncHandler(async (req, res) => {
  try {
    const result = await getUserByIdUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = asyncHandler(async (req, res) => {
  try {
    const result = await updateUserStatusUseCase.execute(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const result = await deleteUserUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getSystemStats = asyncHandler(async (req, res) => {
  try {
    const result = await getSystemStatsUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get system stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
const getSystemLogs = asyncHandler(async (req, res) => {
  try {
    const result = await getSystemLogsUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get system logs error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private (Admin)
const getSystemHealth = asyncHandler(async (req, res) => {
  try {
    const result = await getSystemHealthUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.health,
    });
  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get queue status
// @route   GET /api/admin/queues
// @access  Private (Admin)
const getQueueStatus = asyncHandler(async (req, res) => {
  try {
    const result = await getQueueStatusUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.queues,
    });
  } catch (error) {
    logger.error('Get queue status error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Clear queue
// @route   DELETE /api/admin/queues/:queueName
// @access  Private (Admin)
const clearQueue = asyncHandler(async (req, res) => {
  try {
    const result = await clearQueueUseCase.execute(req.params.queueName);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Clear queue error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
const getSystemSettings = asyncHandler(async (req, res) => {
  try {
    const result = await getSystemSettingsUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.settings,
    });
  } catch (error) {
    logger.error('Get system settings error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
const updateSystemSettings = asyncHandler(async (req, res) => {
  try {
    const result = await updateSystemSettingsUseCase.execute(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.settings,
    });
  } catch (error) {
    logger.error('Update system settings error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Send system notification
// @route   POST /api/admin/notifications
// @access  Private (Admin)
const sendSystemNotification = asyncHandler(async (req, res) => {
  try {
    const result = await sendSystemNotificationUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.notification,
    });
  } catch (error) {
    logger.error('Send system notification error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getSystemReports = asyncHandler(async (req, res) => {
  try {
    const result = await getSystemReportsUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.reports,
    });
  } catch (error) {
    logger.error('Get system reports error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Verify employer document
// @route   PUT /api/admin/employers/:employerId/documents/:documentId/verify
// @access  Private (Admin)
const verifyEmployerDocument = asyncHandler(async (req, res) => {
  try {
    const verifyEmployerDocumentUseCase = req.container.resolve(
      'verifyEmployerDocumentUseCase'
    );

    const result = await verifyEmployerDocumentUseCase.execute({
      documentId: req.params.documentId,
      adminId: req.user.id,
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
    });

    res.status(200).json({
      success: true,
      message: `Document ${
        req.body.status === 'approved' ? 'approved' : 'rejected'
      } successfully`,
      data: result.document,
    });
  } catch (error) {
    logger.error('Verify employer document error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  getSystemDashboard,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  getSystemLogs,
  getSystemHealth,
  getQueueStatus,
  clearQueue,
  getSystemSettings,
  updateSystemSettings,
  sendSystemNotification,
  getSystemReports,
  verifyEmployerDocument,
};
