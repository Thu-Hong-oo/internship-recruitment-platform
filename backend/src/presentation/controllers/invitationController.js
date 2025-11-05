const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');

// @desc    Accept invitation
// @route   POST /api/employers/invitations/accept/:token
// @access  Private (Employer)
const acceptInvitation = asyncHandler(async (req, res) => {
  try {
    const acceptInvitationUseCase = req.container.resolve(
      'acceptInvitationUseCase'
    );

    const result = await acceptInvitationUseCase.execute({
      token: req.params.token,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: `Đã tham gia công ty ${result.company.name}`,
      data: {
        company: {
          id: result.company._id,
          name: result.company.name,
          logo: result.company.logo,
        },
        profile: result.profile,
      },
    });
  } catch (error) {
    if (error.message === 'INVITATION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lời mời',
      });
    }

    if (error.message === 'INVITATION_EXPIRED') {
      return res.status(400).json({
        success: false,
        error: 'Lời mời đã hết hạn',
      });
    }

    if (error.message === 'INVITATION_ALREADY_PROCESSED') {
      return res.status(400).json({
        success: false,
        error: 'Lời mời đã được xử lý rồi',
      });
    }

    if (error.message === 'EMAIL_MISMATCH') {
      return res.status(403).json({
        success: false,
        error: 'Email không khớp với lời mời',
      });
    }

    if (error.message === 'ALREADY_MEMBER') {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã là thành viên của công ty này rồi',
      });
    }

    logger.error('Accept invitation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Reject invitation
// @route   POST /api/employers/invitations/reject/:token
// @access  Private (Employer)
const rejectInvitation = asyncHandler(async (req, res) => {
  try {
    const companyInvitationRepository = req.container.resolve(
      'companyInvitationRepository'
    );

    const invitation = await companyInvitationRepository.findByToken(
      req.params.token
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lời mời',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Lời mời đã được xử lý rồi',
      });
    }

    // Check email matches
    const userRepository = req.container.resolve('userRepository');
    const user = await userRepository.findById(req.user.id);

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Email không khớp với lời mời',
      });
    }

    await companyInvitationRepository.reject(invitation._id);

    res.status(200).json({
      success: true,
      message: 'Đã từ chối lời mời',
    });
  } catch (error) {
    logger.error('Reject invitation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get my invitations
// @route   GET /api/employers/invitations
// @access  Private (Employer)
const getMyInvitations = asyncHandler(async (req, res) => {
  try {
    const userRepository = req.container.resolve('userRepository');
    const user = await userRepository.findById(req.user.id);

    const companyInvitationRepository = req.container.resolve(
      'companyInvitationRepository'
    );

    const invitations = await companyInvitationRepository.findByEmail(
      user.email
    );

    res.status(200).json({
      success: true,
      data: invitations.map(inv => ({
        id: inv._id,
        company: inv.company,
        invitedBy: inv.invitedBy,
        role: inv.role,
        position: inv.position,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        token: inv.token,
      })),
    });
  } catch (error) {
    logger.error('Get invitations error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get invitation by token (for preview)
// @route   GET /api/employers/invitations/:token
// @access  Public
const getInvitationByToken = asyncHandler(async (req, res) => {
  try {
    const companyInvitationRepository = req.container.resolve(
      'companyInvitationRepository'
    );

    const invitation = await companyInvitationRepository.findByToken(
      req.params.token
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lời mời',
      });
    }

    // Check if expired
    if (invitation.isExpired()) {
      return res.status(400).json({
        success: false,
        error: 'Lời mời đã hết hạn',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        company: invitation.company,
        invitedBy: invitation.invitedBy,
        role: invitation.role,
        position: invitation.position,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Get invitation by token error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Cancel invitation (by inviter)
// @route   DELETE /api/employers/invitations/:invitationId
// @access  Private (Employer with permission)
const cancelInvitation = asyncHandler(async (req, res) => {
  try {
    const getEmployerProfileUseCase = req.container.resolve(
      'getEmployerProfileUseCase'
    );

    const profileResult = await getEmployerProfileUseCase.execute({
      userId: req.user.id,
    });

    if (
      !profileResult.employer.permissions.canManageMembers &&
      profileResult.employer.role !== 'owner'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền hủy lời mời',
      });
    }

    const companyInvitationRepository = req.container.resolve(
      'companyInvitationRepository'
    );

    const invitation = await companyInvitationRepository.findById(
      req.params.invitationId
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lời mời',
      });
    }

    if (
      invitation.company._id.toString() !==
      profileResult.employer.company.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền hủy lời mời này',
      });
    }

    await companyInvitationRepository.update(invitation._id, {
      status: 'expired',
    });

    res.status(200).json({
      success: true,
      message: 'Đã hủy lời mời',
    });
  } catch (error) {
    logger.error('Cancel invitation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  acceptInvitation,
  rejectInvitation,
  getMyInvitations,
  getInvitationByToken,
  cancelInvitation,
};
